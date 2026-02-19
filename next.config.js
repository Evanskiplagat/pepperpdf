/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // pdfjs-dist tries to optionally require 'canvas' for Node.js usage.
      // Aliasing it to false tells webpack to skip it in the browser bundle,
      // preventing the "Object.defineProperty called on non-object" crash.
      canvas: false,
      // Safety net: if the import ever reverts to the legacy path, redirect it.
      "pdfjs-dist/legacy/build/pdf.mjs": require.resolve(
        "pdfjs-dist/build/pdf.mjs"
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
