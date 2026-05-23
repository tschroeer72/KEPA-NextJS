'use client';

import { useAuthContext } from "@/providers/auth-context-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerwaltungGuard({ children }: { children: React.ReactNode }) {
    const { isLogin, isFilmeUser } = useAuthContext();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLogin && isFilmeUser) {
            // Wenn FilmeUser, darf er nur auf /verwaltung/kegelfahrten und Unterseiten
            if (!pathname.startsWith('/verwaltung/kegelfahrten')) {
                router.push('/verwaltung/kegelfahrten');
            }
        }
    }, [isLogin, isFilmeUser, pathname, router]);

    return <>{children}</>;
}
