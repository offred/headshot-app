/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "sharp",
    "@imgly/background-removal-node",
    "onnxruntime-web",
  ],
};

module.exports = nextConfig;
