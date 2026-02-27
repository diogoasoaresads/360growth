import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { SessionProvider } from "@/components/shared/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { ImpersonationBannerWrapper } from "@/components/impersonation-banner-wrapper";

export const metadata: Metadata = {
  title: {
    default: "360growth",
    template: "%s | 360growth",
  },
  description: "Plataforma SaaS multi-tenant para gestão de agências digitais",
  keywords: ["agência", "CRM", "tickets", "gestão", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ImpersonationBannerWrapper />
          {children}
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
