import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Halaman operasional tidak boleh di-cache: angka uang dan status mesin
  // harus selalu yang terbaru.
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;
