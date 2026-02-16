"use client";

import { useState, useRef, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";
import { Header } from "./components/Header";
import { UploadZone } from "./components/UploadZone";
import { FileList } from "./components/FileList";
import { ErrorBanner } from "./components/ErrorBanner";
import { ProcessingSkeleton } from "./components/ProcessingSkeleton";
import { ResultsGrid } from "./components/ResultsGrid";
import { Footer } from "./components/Footer";

export interface ProcessedImage {
  name: string;
  url: string;
  blob: Blob;
}

export type ProcessingPhase = "idle" | "cropping" | "removing-bg" | "building-zip";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState<ProcessingPhase>("idle");
  const [bgProgress, setBgProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exportSize, setExportSize] = useState<500 | 1000>(500);
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
    <div
      className="min-h-screen bg-background"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-200 h-150 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--color-accent-glow) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <Header />

        {/* Upload Zone */}
        {results.length === 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <UploadZone
              dragOver={dragOver}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              inputRef={inputRef}
              onFilesSelected={addFiles}
            />

            {/* Selected Files */}
            {files.length > 0 && (
              <FileList
                files={files}
                exportSize={exportSize}
                processing={processing}
                onRemoveFile={removeFile}
                onClearAll={() => setFiles([])}
                onSetExportSize={setExportSize}
                onProcess={processHeadshots}
              />
            )}
          </div>
        )}

        {error && <ErrorBanner error={error} />}

        {processing && (
          <ProcessingSkeleton phaseLabel={phaseLabel} fileCount={files.length} />
        )}

        {results.length > 0 && (
          <ResultsGrid
            results={results}
            onDownloadZip={downloadZip}
            onDownloadImage={downloadImage}
            onReset={reset}
          />
        )}

        <Footer />
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
