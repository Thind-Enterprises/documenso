import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export type PdfToTextOptions = {
  /**
   * Stop extracting once this many pages have been read.
   */
  maxPages?: number;
};

export type PdfPageText = {
  pageNumber: number;
  text: string;
};

/**
 * Extract the text layer of a PDF, page by page.
 *
 * Scanned documents without a text layer return pages with empty text.
 */
export const pdfToText = async (pdfBytes: Uint8Array, options: PdfToTextOptions = {}) => {
  const task = pdfjsLib.getDocument({
    // pdfjs takes ownership of the buffer, so pass a copy.
    data: new Uint8Array(pdfBytes),
    isEvalSupported: false,
  });

  const pdf = await task.promise;

  const pageCount = Math.min(pdf.numPages, options.maxPages ?? pdf.numPages);
  const pages: PdfPageText[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = content.items
      .map((item) => {
        if (!('str' in item)) {
          return '';
        }

        return item.hasEOL ? `${item.str}\n` : item.str;
      })
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    pages.push({ pageNumber, text });

    void page.cleanup();
  }

  await pdf.destroy();

  return {
    pages,
    totalPages: pdf.numPages,
  };
};
