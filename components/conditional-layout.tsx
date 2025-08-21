'use client';

import { usePathname } from 'next/navigation';
import AppBar from "@/components/app-bar";
import AppBarVerwaltung from "@/components/app-bar-verwaltung";
import Footer from "@/components/footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isVerwaltung = pathname.startsWith('/verwaltung');

    if (isVerwaltung) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <AppBarVerwaltung />
                <main className="flex-1 px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
                <Footer/>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <AppBar />
            <main className="flex-1 px-4 py-4">{children}</main>
            <Footer />
        </div>
    );
}