import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KeKucino",
    short_name: "KeKucino",
    description: "Il tuo chef stellato personale",
    start_url: "/",
    display: "standalone",
    background_color: "#3d1200",
    theme_color: "#d97706",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
