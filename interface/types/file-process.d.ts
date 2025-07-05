declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export function getDocument(data: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
}

declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{
    value: string;
  }>;
}

declare module 'xlsx' {
  export function read(data: ArrayBuffer, options: { type: string }): {
    SheetNames: string[];
    Sheets: {
      [key: string]: any;
    };
  };
  
  export const utils: {
    sheet_to_csv(sheet: any): string;
  };
} 