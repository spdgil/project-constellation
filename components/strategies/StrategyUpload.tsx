"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  extractTextFromFile,
  ACCEPTED_EXTENSIONS,
} from "@/lib/extract-text";
import { logClientWarn } from "@/lib/client-logger";
import { formatBytes } from "@/lib/format";

// =============================================================================
// Component
// =============================================================================

export function StrategyUpload() {
  const router = useRouter();

  // File state
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "extracting" | "creating" | "uploading" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Draft title (user can name the strategy before or after upload)
  const [title, setTitle] = useState("");

  // ==========================================================================
  // Process file: extract text → create draft strategy → upload doc → redirect
  // ==========================================================================

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setError(null);
      setIsProcessing(true);

      try {
        // Step 1: Extract text client-side
        setProcessingStep("extracting");
        const extractedText = await extractTextFromFile(f);

        if (!extractedText.trim()) {
          throw new Error("No text could be extracted from this file.");
        }

        // Step 2: Create draft strategy record
        setProcessingStep("creating");
        const strategyTitle =
          title.trim() || f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");

        const createRes = await fetch("/api/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: strategyTitle,
            sourceDocument: f.name,
            summary: "",
            extractedText,
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ??
              `Failed to create strategy (${createRes.status})`,
          );
        }

        const { id: strategyId } = (await createRes.json()) as { id: string };

        // Step 3: Upload source document binary
        setProcessingStep("uploading");
        try {
          const formData = new FormData();
          formData.append("file", f);
          formData.append("label", f.name);
          await fetch(`/api/strategies/${strategyId}/documents`, {
            method: "POST",
            body: formData,
          });
        } catch (error) {
          // Document upload failed but strategy was created — not fatal
          logClientWarn(
            "Document upload failed, strategy draft was still created.",
            { error: String(error) },
            "StrategyUpload",
          );
        }

        // Step 4: Redirect to draft page
        router.push(`/lga/strategies/${strategyId}/draft`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setIsProcessing(false);
        setProcessingStep(null);
      }
    },
    [title, router],
  );

  // ==========================================================================
  // Drop handlers
  // ==========================================================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) processFile(dropped);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    setIsProcessing(false);
    setProcessingStep(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleRetry = useCallback(() => {
    if (file) processFile(file);
  }, [file, processFile]);

  // ==========================================================================
  // Helpers
  // ==========================================================================

  const stepLabel = (() => {
    switch (processingStep) {
      case "extracting":
        return "Extracting text from document…";
      case "creating":
        return "Creating draft strategy record…";
      case "uploading":
        return "Uploading source document…";
      default:
        return "Processing…";
    }
  })();

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-8" data-testid="strategy-upload">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-normal leading-[1.3] text-[#2C2C2C]">
            Upload Strategy Document
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-prose mt-1">
            Upload a sector development strategy document. Text will be
            extracted and stored for AI-assisted analysis.
          </p>
        </div>
        <Link
          href="/lga/strategies"
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          Back to strategies
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-xl space-y-5">
        {/* Strategy title */}
        <div>
          <label
            htmlFor="strategy-title"
            className="block text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1.5"
          >
            Strategy title (optional — derived from filename if blank)
          </label>
          <input
            id="strategy-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Greater Whitsunday METS Diversification Strategy"
            disabled={isProcessing}
            className="w-full h-10 px-3 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm placeholder:text-[#9A9A9A] focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out disabled:opacity-50"
            data-testid="strategy-title-input"
          />
        </div>

        {/* File upload area */}
        <div>
          <p className="block text-[10px] uppercase tracking-wider text-[#6B6B6B] mb-1.5">
            Document
          </p>

          {!file ? (
            <div
              data-testid="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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
                <span className="text-[#7A6B5A] font-medium">
                  Click to upload
                </span>{" "}
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
              {!isProcessing && (
                <button
                  onClick={clearFile}
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
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            className="sr-only"
            data-testid="file-input"
            aria-label="Upload document"
          />
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div
            className="flex items-center gap-3 bg-[#F5F3F0] border border-[#E8E6E3] px-4 py-3"
            role="status"
            data-testid="processing-status"
          >
            <svg
              className="h-5 w-5 animate-spin text-[#7A6B5A]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                className="opacity-75"
              />
            </svg>
            <p className="text-sm text-[#2C2C2C]">{stepLabel}</p>
          </div>
        )}

        {/* Error with retry */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 px-4 py-3 space-y-2"
            role="alert"
            data-testid="upload-error"
          >
            <p className="text-sm text-red-800">{error}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={clearFile}
                className="text-xs text-[#6B6B6B] underline underline-offset-2 hover:text-[#2C2C2C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A]"
              >
                Choose a different file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
