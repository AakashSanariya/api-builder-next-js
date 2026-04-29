import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./AppShell";
import { PopupProvider } from "../contexts/PopupContext";

export const metadata: Metadata = {
  title: "Dynamic API Builder",
  description: "Generate production-ready APIs from a drag-and-drop schema engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PopupProvider>
          <AppShell>{children}</AppShell>
        </PopupProvider>
      </body>
    </html>
  );
}
