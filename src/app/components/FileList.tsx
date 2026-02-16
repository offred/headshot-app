interface FileListProps {
  files: File[];
  exportSize: 500 | 1000;
  processing: boolean;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onSetExportSize: (size: 500 | 1000) => void;
  onProcess: () => void;
}

export function FileList({
  files,
  exportSize,
  processing,
  onRemoveFile,
  onClearAll,
  onSetExportSize,
  onProcess,
}: FileListProps) {
  return (
    <div className="mt-6 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-mono text-xs tracking-wider uppercase text-secondary"
        >
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer text-tertiary"
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-red)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-tertiary)")
          }
        >
          Clear all
        </button>
      </div>

      {files.map((file, i) => (
        <div
          key={`${file.name}-${i}`}
          className="flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors bg-surface-raised border border-border-subtle"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded shrink-0 bg-cover bg-center border border-border"
              style={{
                backgroundImage: `url(${URL.createObjectURL(file)})`,
              }}
            />
            <span
              className="text-sm truncate text-primary"
            >
              {file.name}
            </span>
            <span
              className="font-mono text-xs shrink-0 text-tertiary"
            >
              {(file.size / 1024).toFixed(0)}KB
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFile(i);
            }}
            className="ml-3 p-1 rounded transition-colors cursor-pointer text-tertiary"
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-red)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-tertiary)")
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      {/* Export Size */}
      <div
        className="mt-4 flex items-center justify-between py-3 px-4 rounded-lg bg-surface-raised border border-border-subtle"
      >
        <span
          className="font-mono text-xs tracking-wider uppercase text-secondary"
        >
          Export size
        </span>
        <div className="flex gap-1">
          {([500, 1000] as const).map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                onSetExportSize(size);
              }}
              className="py-1.5 px-3 rounded-md font-mono text-xs transition-all cursor-pointer"
              style={{
                backgroundColor:
                  exportSize === size
                    ? "var(--color-accent)"
                    : "transparent",
                color:
                  exportSize === size
                    ? "var(--color-background)"
                    : "var(--color-tertiary)",
                fontWeight: exportSize === size ? 600 : 400,
              }}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Process Button */}
      <div className="pt-6">
        <button
          onClick={onProcess}
          disabled={processing}
          className="w-full py-4 px-6 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
          style={{
            backgroundColor: processing
              ? "var(--color-surface-raised)"
              : "var(--color-accent)",
            color: processing ? "var(--color-secondary)" : "var(--color-base)",
            boxShadow: processing
              ? "none"
              : "0 0 30px var(--color-accent-glow-strong)",
          }}
          onMouseEnter={(e) => {
            if (!processing)
              e.currentTarget.style.boxShadow =
                "0 0 50px var(--color-accent-glow-strong)";
          }}
          onMouseLeave={(e) => {
            if (!processing)
              e.currentTarget.style.boxShadow =
                "0 0 30px var(--color-accent-glow-strong)";
          }}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin-slow"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Processing headshots&hellip;
            </span>
          ) : (
            `Process ${files.length} Headshot${files.length !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </div>
  );
}
