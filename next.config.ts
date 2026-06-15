/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Chuyển hướng ngầm mọi request bắt đầu bằng /api/ xuống BE Server
        destination: "http://103.200.20.228:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
