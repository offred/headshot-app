/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["sharp", "onnxruntime-web"],
};

module.exports = nextConfig;
