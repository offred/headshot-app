import { ProcessedImage } from "../page";

interface ResultsGridProps {
  results: ProcessedImage[];
  onDownloadZip: () => void;
  onDownloadImage: (img: ProcessedImage) => void;
  onReset: () => void;
}

export function ResultsGrid({
  results,
  onDownloadZip,
  onDownloadImage,
  onReset,
}: ResultsGridProps) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div
            className="font-mono text-xs tracking-[0.3em] uppercase mb-2"
            style={{ color: "var(--green)" }}
          >
            Complete
          </div>
          <h2
            className="font-display text-3xl"
            style={{ color: "var(--text)" }}
          >
            {results.length} Headshot{results.length !== 1 ? "s" : ""}{" "}
            Processed
          </h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="py-2.5 px-5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--surface-raised)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--surface-hover)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--surface-raised)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            New Batch
          </button>
          <button
            onClick={onDownloadZip}
            className="py-2.5 px-5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-2"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--black)",
              boxShadow: "0 0 20px var(--accent-glow-strong)",
            }}
            onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 40px var(--accent-glow-strong)")
            }
            onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 20px var(--accent-glow-strong)")
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
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download All
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {results.map((img, i) => (
          <div
            key={img.name}
            className="group relative animate-fade-in-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div
              className="aspect-square rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Checkered background for transparency */}
              <div
                className="w-full h-full relative"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #151515 25%, transparent 25%), linear-gradient(-45deg, #151515 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #151515 75%), linear-gradient(-45deg, transparent 75%, #151515 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition:
                    "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover relative z-10"
                  draggable={false}
                />
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 bg-linear-to-t from-black/70 via-transparent to-transparent">
              <button
                onClick={() => onDownloadImage(img)}
                className="py-1.5 px-4 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "var(--text)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Download
              </button>
            </div>

            {/* Filename */}
            <p
              className="mt-2 text-xs truncate font-mono"
              style={{ color: "var(--text-tertiary)" }}
            >
              {img.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
