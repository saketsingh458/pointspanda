import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "creditcards.chase.com", pathname: "/content/dam/**" },
      { protocol: "https", hostname: "www.chase.com", pathname: "/content/dam/**" },
      { protocol: "https", hostname: "ecm.capitalone.com", pathname: "/WCM/card/**" },
      { protocol: "https", hostname: "icm.aexp-static.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.robinhood.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
