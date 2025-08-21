import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "next-themes";
import { Analytics } from "@vercel/analytics/next"
import ConditionalLayout from "@/components/conditional-layout";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Kegelgruppe KEPA 1958",
    description: "Kegelgruppe KEPA 1958 - Offizielle Webseite der Kegelgruppe KEPA 1958",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" className="h-full" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <ThemeProvider attribute="class"
                       defaultTheme="system"
                       enableSystem
                       disableTransitionOnChange
                       storageKey="theme-preference"
        >
            <ConditionalLayout>{children}</ConditionalLayout>
            <Analytics />
        </ThemeProvider>
        </body>
        </html>
    );
}