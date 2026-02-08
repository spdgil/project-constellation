import type { ChangeEvent, DragEvent, RefObject } from "react";

interface InvestmentMemoUploadPanelProps {
  file: File | null;
  isDragging: boolean;
  error: string | null;
  acceptedExtensions: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRetry: () => void;
  onClearFile: () => void;
  formatBytes: (bytes: number) => string;
}

export function InvestmentMemoUploadPanel({
  file,
  isDragging,
  error,
  acceptedExtensions,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onRetry,
  onClearFile,
  formatBytes,
}: InvestmentMemoUploadPanelProps) {
  return (
    <div className="space-y-5">
      {/* File upload area */}
      <div>
        <p className="block text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1.5">
          Document
        </p>

        {!file ? (
          <div
            data-testid="drop-zone"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload document"
            className={`
              w-full border-2 border-dashed px-4 py-10 text-center cursor-pointer
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2
              ${
                isDragging
                  ? "border-[#7A6B5A] bg-amber-50/40"
                  : "border-[#E8E6E3] bg-[#FAF9F7] hover:border-[#C8C4BF] hover:bg-white"
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="mx-auto h-8 w-8 text-[#C8C4BF] mb-3"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <p className="text-sm text-[#6B6B6B]">
              <span className="text-[#7A6B5A] font-medium">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-[10px] text-[#999] mt-1.5">
              PDF, TXT, MD, or CSV (max 20 MB)
            </p>
          </div>
        ) : (
          <div className="border border-[#E8E6E3] bg-white px-4 py-3 flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 bg-[#F5F3F0] border border-[#E8E6E3] flex items-center justify-center">
              <span className="text-[10px] font-medium uppercase text-[#6B6B6B]">
                {file.name.split(".").pop()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm text-[#2C2C2C] truncate"
                data-testid="file-name"
              >
                {file.name}
              </p>
              <p className="text-[10px] text-[#999]">
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={onClearFile}
              aria-label="Remove file"
              className="shrink-0 text-[#999] hover:text-[#2C2C2C] transition-colors p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions}
          onChange={onFileChange}
          className="sr-only"
          data-testid="file-input"
          aria-label="Upload document"
        />
      </div>

      {/* Error with retry */}
      {error && (
        <div className="space-y-3">
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2"
            role="alert"
          >
            {error}
          </p>
          <button
            onClick={onRetry}
            className="w-full text-sm font-medium py-2.5 px-4 bg-[#2C2C2C] text-white hover:bg-[#444] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#7A6B5A] focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
