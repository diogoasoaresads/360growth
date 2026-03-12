import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "../../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Raiz Educação",
    template: "%s | Raiz Educação",
  },
  description: "Formando cidadãos com raízes sólidas e visão de futuro",
  keywords: ["educação", "escola", "ensino", "formação", "raiz"],
};

export default function RaizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
