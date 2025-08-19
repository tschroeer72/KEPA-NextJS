import Divider from "@/components/devider";
import Link from "next/link";

export default function Footer() {
    const getCurrentYear = () => new Date().getFullYear();

    return(
        <footer className="mt-auto border-t bg-background">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <p className="text-sm text-muted-foreground">
                            © {getCurrentYear()} <span className="text-lg font-bold text-primary">Kegelgruppe KEPA</span> | Powered by
                            Thorsten Schröer
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/impressum"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                            >
                                Impressum
                            </Link>

                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}