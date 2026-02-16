"use client";

import { useState, useRef, useCallback } from "react";
import { Logo } from "./components/Logo";

interface ProcessedImage {
  name: string;
  url: string;
  blob: Blob;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exportSize, setExportSize] = useState<1000 | 500>(1000);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const valid = Array.from(newFiles).filter((f) =>
      allowed.some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setFiles((prev) => [...prev, ...valid]);
    setError(null);
    setResults([]);
    setZipBlob(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const processHeadshots = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setResults([]);
    setZipBlob(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("size", String(exportSize));

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Processing failed" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      setZipBlob(blob);

      // Extract PNGs from zip using built-in APIs
      const arrayBuffer = await blob.arrayBuffer();
      const images = await extractPngsFromZip(arrayBuffer);
      setResults(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const downloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "headshots.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = (img: ProcessedImage) => {
    const a = document.createElement("a");
    a.href = img.url;
    a.download = img.name;
    a.click();
  };

  const reset = () => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setFiles([]);
    setResults([]);
    setZipBlob(null);
    setError(null);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--black)" }}>
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-200 h-150 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-8">
            <Logo
              className="h-10 w-auto"
              style={{
                color: "var(--accent)",
                filter: "drop-shadow(0 0 12px var(--accent-glow-strong))",
              }}
            />
            <div
              className="h-8 w-px"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            />
            <div className="flex flex-col gap-0.5">
              <span
                className="text-md font-bold"
                style={{ color: "var(--text)" }}
              >
                TellyDraft.com
              </span>
            </div>
          </div>
          <h1
            className="font-display text-6xl tracking-tight leading-none mb-3"
            style={{ color: "var(--text)" }}
          >
            Headshot Processor
          </h1>
          <p
            className="text-base max-w-md"
            style={{ color: "var(--text-secondary)" }}
          >
            Upload cast photos, crop &amp; remove backgrounds. Download
            production-ready PNGs.
          </p>
        </header>

        {/* Upload Zone */}
        {results.length === 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed p-12 transition-all duration-300"
              style={{
                borderColor: dragOver ? "var(--accent)" : "var(--border)",
                backgroundColor: dragOver
                  ? "var(--accent-glow)"
                  : "var(--surface)",
                boxShadow: dragOver
                  ? "0 0 40px var(--accent-glow), inset 0 0 40px var(--accent-glow)"
                  : "none",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />

              <div className="flex flex-col items-center text-center gap-4">
                {/* Upload Icon */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                  }}
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
                    style={{ color: "var(--accent)" }}
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <div>
                  <p className="text-lg font-medium" style={{ color: "var(--text)" }}>
                    Drop images here
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    or click to browse &mdash; JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-6 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-xs tracking-wider uppercase"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles([]);
                    }}
                    className="font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--red)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-tertiary)")
                    }
                  >
                    Clear all
                  </button>
                </div>

                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded shrink-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${URL.createObjectURL(file)})`,
                          border: "1px solid var(--border)",
                        }}
                      />
                      <span
                        className="text-sm truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {file.name}
                      </span>
                      <span
                        className="font-mono text-xs shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="ml-3 p-1 rounded transition-colors cursor-pointer"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--red)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-tertiary)")
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
                  className="mt-4 flex items-center justify-between py-3 px-4 rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="font-mono text-xs tracking-wider uppercase"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Export size
                  </span>
                  <div className="flex gap-1">
                    {([1000, 500] as const).map((size) => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportSize(size);
                        }}
                        className="py-1.5 px-3 rounded-md font-mono text-xs transition-all cursor-pointer"
                        style={{
                          backgroundColor:
                            exportSize === size
                              ? "var(--accent)"
                              : "transparent",
                          color:
                            exportSize === size
                              ? "var(--black)"
                              : "var(--text-tertiary)",
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
                    onClick={processHeadshots}
                    disabled={processing}
                    className="w-full py-4 px-6 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: processing
                        ? "var(--surface-raised)"
                        : "var(--accent)",
                      color: processing ? "var(--text-secondary)" : "var(--black)",
                      boxShadow: processing
                        ? "none"
                        : "0 0 30px var(--accent-glow-strong)",
                    }}
                    onMouseEnter={(e) => {
                      if (!processing)
                        e.currentTarget.style.boxShadow =
                          "0 0 50px var(--accent-glow-strong)";
                    }}
                    onMouseLeave={(e) => {
                      if (!processing)
                        e.currentTarget.style.boxShadow =
                          "0 0 30px var(--accent-glow-strong)";
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
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mt-6 p-4 rounded-xl border animate-fade-in"
            style={{
              backgroundColor: "rgba(196, 92, 74, 0.08)",
              borderColor: "rgba(196, 92, 74, 0.3)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--red)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Processing Skeleton */}
        {processing && (
          <div className="mt-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent-glow-strong)",
                  animation: "fade-in 0.8s ease-in-out infinite alternate",
                }}
              />
              <span
                className="font-mono text-xs tracking-wider uppercase"
                style={{ color: "var(--accent-dim)" }}
              >
                Detecting faces &amp; removing backgrounds
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl animate-shimmer"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
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
                  onClick={reset}
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
                  onClick={downloadZip}
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
                      onClick={() => downloadImage(img)}
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
        )}

        {/* Footer */}
        <footer
          className="mt-24 pt-8"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="font-sans text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                &copy; {new Date().getFullYear()} Off Red, LLC.
              </span>
            </div>
            <p
              className="font-sans text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              TellyDraft Production Tools
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Extract PNG files from a zip ArrayBuffer using the ZIP local file header format.
 * No external dependencies needed — reads the binary zip structure directly.
 */
async function extractPngsFromZip(
  buffer: ArrayBuffer
): Promise<ProcessedImage[]> {
  const view = new DataView(buffer);
  const images: ProcessedImage[] = [];
  let offset = 0;

  while (offset < buffer.byteLength - 4) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) break; // Local file header signature

    const compressedMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const fileNameBytes = new Uint8Array(buffer, offset + 30, fileNameLen);
    const fileName = new TextDecoder().decode(fileNameBytes);

    const dataOffset = offset + 30 + fileNameLen + extraLen;
    const dataSize = compressedSize || uncompressedSize;

    if (fileName.toLowerCase().endsWith(".png") && compressedMethod === 0) {
      const pngData = new Uint8Array(buffer, dataOffset, dataSize);
      const blob = new Blob([pngData], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      images.push({ name: fileName, url, blob });
    }

    offset = dataOffset + dataSize;
  }

  return images;
}
