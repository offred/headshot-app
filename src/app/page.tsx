"use client";

import { useState, useRef, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";
import { Logo } from "./components/Logo";

interface ProcessedImage {
  name: string;
  url: string;
  blob: Blob;
}

type ProcessingPhase = "idle" | "cropping" | "removing-bg" | "building-zip";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState<ProcessingPhase>("idle");
  const [bgProgress, setBgProgress] = useState({ done: 0, total: 0 });
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
    setPhase("cropping");
    setError(null);
    setResults([]);
    setZipBlob(null);
    setBgProgress({ done: 0, total: 0 });

    try {
      // Phase 1: Server crops the images
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("size", String(exportSize));

      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Processing failed" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const zipArrayBuffer = await (await res.blob()).arrayBuffer();
      const croppedImages = await extractPngsFromZip(zipArrayBuffer);

      if (croppedImages.length === 0) {
        throw new Error("No images were returned from the server");
      }

      // Phase 2: Remove backgrounds client-side
      setPhase("removing-bg");
      setBgProgress({ done: 0, total: croppedImages.length });

      const bgRemovedImages: ProcessedImage[] = [];

      for (let i = 0; i < croppedImages.length; i++) {
        const img = croppedImages[i];
        const resultBlob = await removeBackground(img.blob, {
          output: { format: "image/png" },
        });
        const url = URL.createObjectURL(resultBlob);
        bgRemovedImages.push({ name: img.name, url, blob: resultBlob });
        // Clean up the cropped image URL
        URL.revokeObjectURL(img.url);
        setBgProgress({ done: i + 1, total: croppedImages.length });
      }

      setResults(bgRemovedImages);

      // Phase 3: Build final ZIP client-side
      setPhase("building-zip");
      const finalZipBlob = await buildZip(bgRemovedImages);
      setZipBlob(finalZipBlob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
      setPhase("idle");
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

  const phaseLabel =
    phase === "cropping"
      ? "Cropping headshots\u2026"
      : phase === "removing-bg"
        ? `Removing backgrounds\u2026 (${bgProgress.done}/${bgProgress.total})`
        : phase === "building-zip"
          ? "Building download\u2026"
          : "Processing\u2026";

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
                {phaseLabel}
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

/** CRC-32 lookup table */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Build a ZIP file from processed images using a minimal ZIP writer.
 * Uses STORE (no compression) since PNGs are already compressed.
 */
async function buildZip(images: ProcessedImage[]): Promise<Blob> {
  const entries: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const img of images) {
    const nameBytes = new TextEncoder().encode(img.name);
    const data = new Uint8Array(await img.blob.arrayBuffer());
    const crc = crc32(data);

    // Local file header (30 bytes + name + data)
    const header = new ArrayBuffer(30);
    const hv = new DataView(header);
    hv.setUint32(0, 0x04034b50, true);          // signature
    hv.setUint16(4, 20, true);                   // version needed
    hv.setUint16(8, 0, true);                    // compression: STORE
    hv.setUint32(14, crc, true);                 // crc-32
    hv.setUint32(18, data.length, true);         // compressed size
    hv.setUint32(22, data.length, true);         // uncompressed size
    hv.setUint16(26, nameBytes.length, true);    // file name length

    const headerBytes = new Uint8Array(header);
    parts.push(headerBytes, nameBytes, data);
    entries.push({ name: nameBytes, data, crc, offset });
    offset += headerBytes.length + nameBytes.length + data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = new ArrayBuffer(46);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true);           // central dir signature
    cv.setUint16(4, 20, true);                    // version made by
    cv.setUint16(6, 20, true);                    // version needed
    cv.setUint16(10, 0, true);                    // compression: STORE
    cv.setUint32(16, entry.crc, true);            // crc-32
    cv.setUint32(20, entry.data.length, true);    // compressed size
    cv.setUint32(24, entry.data.length, true);    // uncompressed size
    cv.setUint16(28, entry.name.length, true);    // file name length
    cv.setUint32(42, entry.offset, true);         // local header offset

    parts.push(new Uint8Array(cd), entry.name);
    offset += 46 + entry.name.length;
  }

  // End of central directory
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);             // EOCD signature
  ev.setUint16(8, entries.length, true);          // total entries on disk
  ev.setUint16(10, entries.length, true);         // total entries
  ev.setUint32(12, offset - cdStart, true);       // central dir size
  ev.setUint32(16, cdStart, true);                // central dir offset
  parts.push(new Uint8Array(eocd));

  return new Blob(parts as BlobPart[], { type: "application/zip" });
}
