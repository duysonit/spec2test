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
        className={`rounded-lg border border-dashed px-3 py-2.5 text-sm transition ${
          disabled
            ? 'border-slate-800 bg-slate-900 text-slate-600'
            : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-accent-400 hover:bg-accent-500/10'
        }`}
      >
        <span className="font-medium text-slate-200">Import from file</span>
        <span className="mx-1.5 text-slate-600">·</span>
        <button
          type="button"
          disabled={disabled || status === 'loading'}
          onClick={() => inputRef.current?.click()}
          className="font-medium text-accent-300 underline hover:text-accent-200 disabled:text-slate-600 disabled:no-underline"
        >
          {status === 'loading' ? 'Reading file...' : 'Choose file'}
        </button>
        <span className="text-slate-400"> or drag and drop here</span>
        <p className="mt-1 text-xs text-slate-500">
          PDF, DOCX, TXT, or images (PNG, JPG). OCR runs in the browser for images. Legacy .doc is not supported, use
          .docx or PDF.
        </p>
      </div>
      {message && (
        <p
          className={`mt-1.5 text-xs ${status === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
