import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import JSZip from "jszip";
import path from "path";
import fs from "fs";

const VALID_SIZES = new Set([500, 1000]);
const DEFAULT_SIZE = 500;
const TOP_PADDING_PX = 20;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// UltraFace model expects 640x480 input
const MODEL_WIDTH = 640;
const MODEL_HEIGHT = 480;

// Dynamic import so onnxruntime-web's WASM files aren't resolved at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ort: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let session: any = null;

async function getOrt() {
  if (ort) return ort;
  // @ts-expect-error -- onnxruntime-web types don't resolve under "exports" in v1.21
  ort = await import("onnxruntime-web");

  // Read the WASM binary directly from disk to bypass path resolution issues
  // (file:// URLs, spaces in paths, Vercel bundling)
  const wasmPath = path.join(
    process.cwd(),
    "node_modules",
    "onnxruntime-web",
    "dist",
    "ort-wasm-simd-threaded.wasm"
  );
  ort.env.wasm.wasmBinary = fs.readFileSync(wasmPath);
  ort.env.wasm.numThreads = 1;

  return ort;
}

async function getSession() {
  if (session) return session;

  const ortModule = await getOrt();
  const modelPath = path.join(process.cwd(), "models", "ultraface_640.onnx");
  const modelBuffer = fs.readFileSync(modelPath);
  session = await ortModule.InferenceSession.create(modelBuffer.buffer, {
    executionProviders: ["wasm"],
  });
  return session;
}

interface FaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

async function detectFaces(
  imageBuffer: Buffer,
  imgWidth: number,
  imgHeight: number
): Promise<FaceRect[]> {
  const sess = await getSession();

  // Resize image to model input size (640x480) and get raw RGB pixels
  const resized = await sharp(imageBuffer)
    .resize(MODEL_WIDTH, MODEL_HEIGHT, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Normalize to float32 [0, 1] in NCHW format (batch=1, channels=3, height=480, width=640)
  const float32Data = new Float32Array(1 * 3 * MODEL_HEIGHT * MODEL_WIDTH);
  for (let y = 0; y < MODEL_HEIGHT; y++) {
    for (let x = 0; x < MODEL_WIDTH; x++) {
      const pixelIdx = (y * MODEL_WIDTH + x) * 3;
      const tensorIdx = y * MODEL_WIDTH + x;
      float32Data[0 * MODEL_HEIGHT * MODEL_WIDTH + tensorIdx] =
        (resized[pixelIdx] - 127) / 128; // R
      float32Data[1 * MODEL_HEIGHT * MODEL_WIDTH + tensorIdx] =
        (resized[pixelIdx + 1] - 127) / 128; // G
      float32Data[2 * MODEL_HEIGHT * MODEL_WIDTH + tensorIdx] =
        (resized[pixelIdx + 2] - 127) / 128; // B
    }
  }

  const { Tensor } = await getOrt();
  const inputTensor = new Tensor("float32", float32Data, [
    1,
    3,
    MODEL_HEIGHT,
    MODEL_WIDTH,
  ]);

  const results = await sess.run({ input: inputTensor });

  // UltraFace outputs: "scores" [1, N, 2] and "boxes" [1, N, 4]
  const scores = results["scores"].data as Float32Array;
  const boxes = results["boxes"].data as Float32Array;
  const numDetections = scores.length / 2;

  const faces: FaceRect[] = [];
  for (let i = 0; i < numDetections; i++) {
    const confidence = scores[i * 2 + 1]; // face confidence
    if (confidence < 0.7) continue;

    // Boxes are in [x1, y1, x2, y2] format, normalized [0,1]
    const x1 = boxes[i * 4] * imgWidth;
    const y1 = boxes[i * 4 + 1] * imgHeight;
    const x2 = boxes[i * 4 + 2] * imgWidth;
    const y2 = boxes[i * 4 + 3] * imgHeight;

    faces.push({
      x: Math.round(x1),
      y: Math.round(y1),
      width: Math.round(x2 - x1),
      height: Math.round(y2 - y1),
      confidence,
    });
  }

  return faces;
}

function selectBestFace(
  faces: FaceRect[],
  imgHeight: number
): FaceRect | null {
  if (faces.length === 0) return null;

  // Prefer faces in the upper portion of the image (same logic as Python version)
  let bestFace = faces[0];
  let bestScore = -1;

  for (const face of faces) {
    const cy = face.y + face.height / 2;
    let positionScore: number;

    if (cy < imgHeight * 0.5) {
      positionScore = 3.0;
    } else if (cy < imgHeight * 0.65) {
      positionScore = 1.0;
    } else {
      positionScore = 0.05;
    }

    const score = face.confidence * positionScore;
    if (score > bestScore) {
      bestScore = score;
      bestFace = face;
    }
  }

  return bestFace;
}

function headshotCrop(
  imgWidth: number,
  imgHeight: number,
  face: FaceRect
): { left: number; top: number; size: number } {
  const faceCx = face.x + face.width / 2;

  // Estimate top of head: face box top is roughly at eyebrows/forehead
  // Crown/hair extends ~35% of face height above the face box top
  const headTop = face.y - Math.round(0.35 * face.height);

  // For head-to-upper-shoulder, crop ~2.2x face height
  let cropSize = Math.round(face.height * 2.2);
  cropSize = Math.min(cropSize, imgWidth, imgHeight);
  cropSize = Math.max(cropSize, Math.round(face.height * 1.6));
  cropSize = Math.min(cropSize, imgWidth, imgHeight);

  // Convert TOP_PADDING_PX (in final 1000px output) to original image coords
  const paddingOrig = Math.round((TOP_PADDING_PX / 1000) * cropSize);

  // Top of crop: position so headTop lands paddingOrig pixels below the crop edge
  let top = headTop - paddingOrig;
  let left = faceCx - cropSize / 2;

  // Clamp to image bounds
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (left + cropSize > imgWidth) left = imgWidth - cropSize;
  if (top + cropSize > imgHeight) top = imgHeight - cropSize;
  left = Math.max(0, Math.round(left));
  top = Math.max(0, Math.round(top));

  return { left, top, size: cropSize };
}

function fallbackCrop(
  imgWidth: number,
  imgHeight: number
): { left: number; top: number; size: number } {
  const cropSize = Math.min(imgWidth, imgHeight);
  const left = Math.round((imgWidth - cropSize) / 2);
  return { left, top: 0, size: cropSize };
}

async function processImage(fileBuffer: Buffer, targetSize: number): Promise<Buffer> {
  const metadata = await sharp(fileBuffer).metadata();
  const imgWidth = metadata.width!;
  const imgHeight = metadata.height!;

  // Detect faces
  const faces = await detectFaces(fileBuffer, imgWidth, imgHeight);
  const face = selectBestFace(faces, imgHeight);

  // Determine crop region
  const crop = face
    ? headshotCrop(imgWidth, imgHeight, face)
    : fallbackCrop(imgWidth, imgHeight);

  // Crop and resize
  const croppedBuffer = await sharp(fileBuffer)
    .extract({
      left: crop.left,
      top: crop.top,
      width: crop.size,
      height: crop.size,
    })
    .resize(targetSize, targetSize, { fit: "fill" })
    .png()
    .toBuffer();

  return croppedBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const sizeParam = Number(formData.get("size")) || DEFAULT_SIZE;
    const targetSize = VALID_SIZES.has(sizeParam) ? sizeParam : DEFAULT_SIZE;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const zip = new JSZip();
    let processedCount = 0;
    const errors: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const filename = file.name || "unknown";
      const ext = path.extname(filename).toLowerCase();

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        errors.push(`${filename}: unsupported format`);
        continue;
      }

      const name = path.basename(filename, ext);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const resultBuffer = await processImage(buffer, targetSize);
        zip.file(`${name}.png`, resultBuffer);
        processedCount++;
      } catch (e) {
        console.error(`Error processing ${filename}:`, e);
        errors.push(
          `${filename}: ${e instanceof Error ? e.message : "processing failed"}`
        );
      }
    }

    if (processedCount === 0) {
      const errorMsg = errors.length > 0
        ? `No images processed: ${errors.join("; ")}`
        : "No images processed";
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    // Use STORE compression (no deflate) so the client can parse the ZIP
    // with the simple local-file-header reader without needing decompression
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "STORE",
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="headshots.zip"',
      },
    });
  } catch (e) {
    console.error("Processing error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Processing failed" },
      { status: 500 }
    );
  }
}
