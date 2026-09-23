import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Futurex Learning - Student Portal",
    short_name: "Futurex Student",
    description: "Official Student Academic Portal for Attendance, DPPs, Test Series & Smart ID",
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06080f",
    theme_color: "#06080f",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
