import { filesApi } from '@/lib/api';

/**
 * Extract plain text from requirement files.
 * Server-side extraction for PDF/DOCX/TXT/MD avoids fragile browser parser/runtime issues.
 */
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|tif|tiff)$/i;

export async function extractRequirementFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';

  if (ext === '.doc' || file.type === 'application/msword') {
    throw new Error(
      'Legacy Word .doc files are not supported in the browser. Save as .docx or export to PDF, then import again.'
    );
  }

  if (
    ext === '.txt' ||
    ext === '.md' ||
    ext === '.markdown' ||
    file.type === 'text/plain' ||
    ext === '.docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.pdf' ||
    file.type === 'application/pdf'
  ) {
    const response = await filesApi.extractText(file);
    return response.data.text.trim();
  }

  if (file.type.startsWith('image/') || IMAGE_EXT.test(file.name)) {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    try {
      const {
        data: { text },
      } = await worker.recognize(file);
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error('OCR found no readable text in this image.');
      }
      return trimmed;
    } finally {
      await worker.terminate();
    }
  }

  throw new Error(
    `Unsupported file: "${file.name}". Use PDF, DOCX, TXT, or an image (PNG, JPG, WebP, …).`
  );
}

export const REQUIREMENT_FILE_ACCEPT =
  '.pdf,.doc,.docx,.txt,.md,.markdown,image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/tiff';
