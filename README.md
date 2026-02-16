# Headshot Processor

An internal production tool by **Off Red, LLC** for [TellyDraft.com](https://tellydraft.com). Upload cast photos, automatically detect faces, crop to a head-and-shoulders framing, remove backgrounds, and download production-ready transparent PNGs.

## Features

- **Face Detection** — Automatic face detection using the UltraFace ONNX model to center and frame each headshot
- **Smart Cropping** — Head-to-upper-shoulder framing with consistent padding
- **Background Removal** — AI-powered background removal running client-side in the browser via WASM
- **Batch Processing** — Upload and process multiple images at once
- **Export Sizes** — Choose between 1000px or 500px output
- **ZIP Download** — Download all processed headshots as a single ZIP file
- **Drag & Drop** — Drag images directly into the browser to upload

## Architecture

Processing is split between server and client to stay within Vercel's serverless size limits (~20MB traced vs 250MB limit):

1. **Server** — Receives uploads, detects faces with UltraFace ONNX model, crops to head-and-shoulders framing, resizes, and returns a ZIP of cropped PNGs
2. **Client** — Runs `@imgly/background-removal` (WASM) on each cropped image in the browser, then builds the final downloadable ZIP

## Tech Stack

- **Next.js** (App Router) — Frontend and API
- **React** — UI
- **Tailwind CSS 4** — Styling
- **sharp** — Server-side image cropping and resizing
- **onnxruntime-web** — Server-side face detection inference (UltraFace model)
- **@imgly/background-removal** — Client-side WASM background removal (model loaded on demand from CDN)
- **JSZip** — Server-side ZIP generation

## Setup

### Prerequisites

- Node.js 24.x
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/
    api/
      process/
        route.ts        # API route: face detection, crop, ZIP
    components/
      Logo.tsx          # Off Red logo component
    globals.css         # Global styles and CSS variables
    layout.tsx          # Root layout with font imports
    page.tsx            # Main UI + client-side bg removal
models/
  ultraface_640.onnx    # Face detection ONNX model
```

## Usage

1. Open the app in your browser
2. Drag and drop cast photos (JPG, PNG, or WebP) or click to browse
3. Select export size (1000px or 500px)
4. Click **Process** — faces are detected and images cropped on the server, then backgrounds are removed in your browser
5. Preview results and download individually or as a ZIP
