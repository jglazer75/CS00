import mammoth from 'mammoth';

export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdf(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractTextFromDocx(buffer);
  } else if (mimeType === 'text/plain') {
    return buffer.toString('utf8');
  } else {
    throw new Error(`Unsupported file type for extraction: ${mimeType}`);
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Lazy load pdf-parse to avoid build-time issues with its canvas dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    return data.text;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown PDF extraction error';
    throw new Error(`PDF Extraction failed: ${msg}`);
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown DOCX extraction error';
    throw new Error(`DOCX Extraction failed: ${msg}`);
  }
}