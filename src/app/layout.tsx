import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PsConfirmRoot } from "@/features/shared/confirm/components/ps-confirm-root";
import { PsSnackbarViewport } from "@/features/shared/snackbar/components/ps-snackbar-viewport";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PugStreamX",
    template: "%s · PugStreamX",
  },
  description: "PugStreamX live streaming.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PsSnackbarViewport />
        <PsConfirmRoot />
      </body>
    </html>
  );
}
