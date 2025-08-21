'use client';

import { useState } from 'react';
import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {NavData} from "@/data/navdata";
import { Menu, X } from 'lucide-react';
import {useAuthContext} from "@/providers/auth-context-provider";

export default function AppBar() {
    const {isLogin} = useAuthContext();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="sticky top-0 z-50 bg-gray-800 dark:bg-gray-900 text-white shadow-md">
            <div className="flex items-center justify-between p-4">
                {/* Links: Kegelgruppe Titel */}
                <div className="flex items-center">
                    <Link href="/" className="text-white hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-all">
                        <span className="text-xl font-semibold">Kegelgruppe KEPA 1958</span>
                    </Link>
                </div>

                {/* Desktop Navigation - versteckt auf mobilen Geräten */}
                <div className="hidden md:flex items-center space-x-6">
                    <NavigationMenu>
                        <NavigationMenuList className="flex space-x-4">
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/"
                                        className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                                    >
                                        Home
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            {NavData.map((navItem) => (
                                <NavigationMenuItem key={navItem.title}>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href={navItem.href}
                                            className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                                        >
                                            {navItem.title}
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href={isLogin ? "/verwaltung" : "/login"}
                                        className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                                    >
                                        {isLogin ? "Verwaltung" : "Login"}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    <ThemeSwitcher />
                </div>

                {/* Mobile Menu Button und Theme Switcher */}
                <div className="md:hidden flex items-center space-x-2">
                    <ThemeSwitcher />
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation - sichtbar nur wenn geöffnet */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-700 dark:bg-gray-800 border-t border-gray-600 dark:border-gray-700">
                    <nav className="flex flex-col space-y-1 p-4">
                        <Link
                            href="/"
                            className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        {NavData.map((navItem) => (
                            <Link
                                key={navItem.title}
                                href={navItem.href}
                                className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {navItem.title}
                            </Link>
                        ))}
                        <Link
                            href={isLogin ? "/verwaltung" : "/login"}
                            className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {isLogin ? "Verwaltung" : "Login"}
                        </Link>
                    </nav>
                </div>
            )}
        </div>
    );
}