# Headshot Processor

An internal production tool by **Off Red, LLC** for [TellyDraft.com](https://tellydraft.com). Upload cast photos, automatically detect faces, crop to a head-and-shoulders framing, remove backgrounds, and download production-ready transparent PNGs.

## Features

- **Face Detection** — Automatic face detection using the UltraFace ONNX model to center and frame each headshot
- **Smart Cropping** — Head-to-upper-shoulder framing with consistent padding
- **Background Removal** — AI-powered background removal producing transparent PNGs
- **Batch Processing** — Upload and process multiple images at once
- **Export Sizes** — Choose between 1000px or 500px output
- **ZIP Download** — Download all processed headshots as a single ZIP file
- **Drag & Drop** — Drag images directly into the browser to upload

## Tech Stack

- **Next.js** (App Router) — Frontend and API
- **React** — UI
- **Tailwind CSS 4** — Styling
- **sharp** — Image cropping and resizing
- **@imgly/background-removal-node** — ONNX-based background removal
- **onnxruntime-web** — Face detection inference (UltraFace model)
- **JSZip** — ZIP file generation

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

The app runs at [http://localhost:3000](http://localhost:3000). No separate backend server is needed — the API route handles all image processing.

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
        route.ts        # API route: face detection, crop, bg removal, ZIP
    components/
      Logo.tsx          # Off Red logo component
    globals.css         # Global styles and CSS variables
    layout.tsx          # Root layout with font imports
    page.tsx            # Main upload/results UI
models/
  ultraface_640.onnx    # Face detection ONNX model
```

## Usage

1. Open the app in your browser
2. Drag and drop cast photos (JPG, PNG, or WebP) or click to browse
3. Select export size (1000px or 500px)
4. Click **Process** to detect faces, crop, and remove backgrounds
5. Preview results and download individually or as a ZIP
