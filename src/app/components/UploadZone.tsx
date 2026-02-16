import { RefObject } from "react";

interface UploadZoneProps {
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList) => void;
}

export function UploadZone({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  onFilesSelected,
}: UploadZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className="relative cursor-pointer rounded-xl border-2 border-dashed p-12 transition-all duration-300"
      style={{
        borderColor: dragOver ? "var(--color-accent)" : "var(--color-border)",
        backgroundColor: dragOver
          ? "var(--color-accent-glow)"
          : "var(--color-surface)",
        boxShadow: dragOver
          ? "0 0 40px var(--color-accent-glow), inset 0 0 40px var(--color-accent-glow)"
          : "none",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
      />

      <div className="flex flex-col items-center text-center gap-4">
        {/* Upload Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised border border-border"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div>
          <p className="text-sm sm:text-lg font-medium text-primary">
            Drop images here
          </p>
          <p
            className="text-xs sm:text-sm mt-1 text-tertiary"
          >
            or click to browse &mdash; JPG, PNG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
