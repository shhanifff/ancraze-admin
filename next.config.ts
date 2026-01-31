import type { NextConfig } from "next";
const NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = NextConfig;

// Force restart for module resolution update

