import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Halaman operasional tidak boleh di-cache: angka uang dan status mesin
  // harus selalu yang terbaru.
  experimental: {
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
