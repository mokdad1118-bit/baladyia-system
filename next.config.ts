import type { NextConfig } from "next";

const staffRoot = process.env.NEXT_PUBLIC_STAFF_PORTAL_URL?.replace(/\/$/, "") ?? "";
const staffEmployeeDest = staffRoot ? `${staffRoot}/` : "/admin";
const staffEmployeeNested = staffRoot ? `${staffRoot}/:path*` : "/admin/:path*";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "@libsql/client", "@prisma/adapter-libsql"],
  async redirects() {
    return [
      { source: "/citizen", destination: "/", permanent: false },
      { source: "/citizen/:path*", destination: "/:path*", permanent: false },
      { source: "/employee", destination: staffEmployeeDest, permanent: false },
      { source: "/employee/:path*", destination: staffEmployeeNested, permanent: false },
      { source: "/staff", destination: staffEmployeeDest, permanent: false },
      { source: "/staff/:path*", destination: staffEmployeeNested, permanent: false },
      { source: "/my-requests", destination: "/requests", permanent: false },
      { source: "/my-requests/:id", destination: "/requests/:id", permanent: false },
      { source: "/new-request/:serviceId", destination: "/requests/new/:serviceId", permanent: false },
      { source: "/after-login", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
