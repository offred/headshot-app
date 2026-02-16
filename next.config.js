/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "onnxruntime-web"],
  outputFileTracingIncludes: {
    "/api/process": ["./node_modules/onnxruntime-web/dist/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
