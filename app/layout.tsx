import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://romgai.github.io/awesome-multimodal-world-reasoning/"),
  title: "Awesome Multimodal World Reasoning",
  description:
    "An interactive, bilingual literature and evaluation index for world models in multimodal reasoning.",
  alternates: { canonical: "./" },
  openGraph: {
    title: "Awesome Multimodal World Reasoning",
    description: "Interactive literature and evaluation index for world models in multimodal reasoning.",
    type: "website",
    images: [{ url: "og.png", width: 1705, height: 910, alt: "Awesome Multimodal World Reasoning" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Awesome Multimodal World Reasoning",
    description: "Interactive literature and evaluation index for world models in multimodal reasoning.",
    images: ["og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
