/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "better-sqlite3",
    "pdf-parse",
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "groq-sdk",
  ],
};
module.exports = nextConfig;