"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold mb-4">Seite nicht gefunden</h2>
            <p className="text-muted-foreground mb-8">Leider konnten wir die von Ihnen gesuchte Seite nicht finden.</p>
            <Button asChild>
                <Link href="/">Zurück zur Homepage</Link>
            </Button>
        </div>
    );
};

export default NotFound;
