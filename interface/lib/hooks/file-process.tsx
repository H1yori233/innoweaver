import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { logger } from '@/lib/logger';

async function extractPdfText(file: File) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const pages = pdf.numPages;
        let fullText = '';
        
        for (let i = 1; i <= pages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // 提取文本内容
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error('PDF处理错误:', error);
            throw new Error('PDF文件处理失败，请确保文件格式正确且未损坏。');
        } else {
            logger.error('PDF处理错误:', error);
            throw new Error('PDF文件处理失败，未知错误。');
        }
    }
}

export async function processFileContent(file: File): Promise<string> {
    try {
        let content = "";

        if (file.type === "text/plain") {
            content = await file.text(); // .txt 文件
        } else if (file.type === "text/markdown") {
            content = await file.text(); // .md 文件
        } else if (file.type === "application/pdf") {
            content = await extractPdfText(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value; // .docx 文件
        } else if (file.type === "application/msword") {
            // 对于.doc文件，提示用户转换为.docx格式
            throw new Error("不支持.doc格式，请将文件转换为.docx格式后重试。");
        } else if (
            file.type === "text/csv" ||
            file.type === "application/vnd.ms-excel" ||
            file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            content = XLSX.utils.sheet_to_csv(sheet); // .csv 和 .xlsx 文件
        } else {
            throw new Error("不支持的文件类型。请上传 .txt, .md, .pdf, .docx, .csv, 或 .xlsx 文件。");
        }

        return content; // 返回提取的文件内容
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error processing file:", error);
            throw new Error("An error occurred while processing the file.");
        } else {
            console.error("Error processing file:", error);
            throw new Error("An unknown error occurred while processing the file.");
        }
    }
}
