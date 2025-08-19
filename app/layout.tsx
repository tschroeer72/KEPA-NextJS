
import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "next-themes";
import AppBar from "@/components/app-bar";
import Footer from "@/components/footer";

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
            <div className="min-h-screen flex flex-col">
                <AppBar />
                <main className="flex-1 px-4 py-4">{children}</main>
                <Footer />
            </div>
        </ThemeProvider>
        </body>
        </html>
    );
}