'use client';

import { useCallback, useRef, useState } from 'react';
import { extractRequirementFileText, REQUIREMENT_FILE_ACCEPT } from '@/lib/extractRequirementFileText';

type Props = {
  onTextImported: (text: string) => void;
  disabled?: boolean;
};

export function RequirementTextFileImport({ onTextImported, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const runImport = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setStatus('loading');
      setMessage('');
      try {
        const text = await extractRequirementFileText(file);
        onTextImported(text);
        setStatus('idle');
        setMessage(`Imported: ${file.name}`);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Could not read this file.');
      } finally {
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [disabled, onTextImported]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void runImport(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    void runImport(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="mb-2">
      <input
        ref={inputRef}
        type="file"
        accept={REQUIREMENT_FILE_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={onInputChange}
      />
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`rounded-md border border-dashed px-3 py-2 text-sm transition ${
          disabled ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-400 hover:bg-blue-50/40'
        }`}
      >
        <span className="font-medium text-gray-700">Import from file</span>
        <span className="mx-1.5 text-gray-400">·</span>
        <button
          type="button"
          disabled={disabled || status === 'loading'}
          onClick={() => inputRef.current?.click()}
          className="text-blue-600 hover:text-blue-800 underline disabled:no-underline disabled:text-gray-400"
        >
          {status === 'loading' ? 'Reading file…' : 'Choose file'}
        </button>
        <span className="text-gray-500"> or drag and drop here</span>
        <p className="mt-1 text-xs text-gray-500">
          PDF, DOCX, TXT, or images (PNG, JPG, …). OCR runs in the browser for images. Legacy .doc is not supported — use
          .docx or PDF.
        </p>
      </div>
      {message && (
        <p
          className={`mt-1 text-xs ${status === 'error' ? 'text-red-600' : 'text-green-700'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
