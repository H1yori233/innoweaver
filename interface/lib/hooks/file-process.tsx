import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { logger } from '@/lib/logger';

async function extractPdfText(file) {
    logger.log(file);

    const loadingTask = pdfjsLib.getDocument(file);
    const pdf = await loadingTask.promise;

    const pages = pdf.numPages;
    logger.log(pages);
    
    for (let i = 1; i <= pages; i++)
    {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        logger.log(textContent);
    }

    // const textItems = textContent.items.map(item => ({
    //     text: item.str,
    //     x: item.transform[4],
    //     y: item.transform[5]
    // }));

    // console.log(textItems);
    // return textItems;
}

export async function processFileContent(file: File): Promise<string> {
    try {
        let content = "";

        if (file.type === "text/plain") {
            content = await file.text(); // .txt 文件
        } else if (file.type === "application/pdf") {
            // const arrayBuffer = await file.arrayBuffer();
            // content = await extractPdfText(arrayBuffer);
            await extractPdfText(file);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value; // .docx 文件
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
            throw new Error("Unsupported file type. Please upload a .txt, .pdf, .docx, .csv, or .xlsx file.");
        }

        return content; // 返回提取的文件内容
    } catch (error) {
        console.error("Error processing file:", error);
        throw new Error("An error occurred while processing the file.");
    }
}
