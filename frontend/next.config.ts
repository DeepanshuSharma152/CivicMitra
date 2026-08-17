import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8080", pathname: "/uploads/**" },
      { protocol: "http", hostname: "10.39.70.232", port: "8080", pathname: "/uploads/**" },
      { protocol: "http", hostname: "civicmitra-env.eba-ppjxugtc.ap-south-1.elasticbeanstalk.com", pathname: "/**" }
    ]
  }
};

export default nextConfig;
