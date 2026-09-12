import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Broadcast Spensa OS",
    short_name: "Broadcast Spensa",
    description: "Sistem Operasi Ekstrakurikuler & Manajemen Produksi Media SMP Negeri 1 Spensa",
    start_url: "/",
    display: "standalone",
    background_color: "#070D1E",
    theme_color: "#070D1E",
    icons: [
      {
        src: "/logo/BC_DONE.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo/BC_DONE.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
