﻿'use client';

import { useState } from 'react';
import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import {
    NavigationMenu, NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {NavDataVerwaltung, NavDataVordrucke} from "@/data/navdata-verwaltung";
import {LogOut, Menu, X, ChevronDown, ChevronRight} from 'lucide-react';
import {useAuthContext} from "@/providers/auth-context-provider";
import {useRouter} from "next/navigation";
import axios from 'axios';

export default function AppBarVerwaltung() {
    const {setIsLogin} = useAuthContext();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileVorlagenOpen, setIsMobileVorlagenOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleMobileVorlagen = () => {
        setIsMobileVorlagenOpen(!isMobileVorlagenOpen);
    };

    const handleLogout = async () => {
        try {
            await axios.post("/api/logout");
            setIsLogin(false);
            router.push('/');
        } catch (error) {
            console.error('Logout fehlgeschlagen:', error);
        }
    };

    return (
        <div className="sticky top-0 z-50 bg-gray-800 dark:bg-gray-900 text-white shadow-md">
            <div className="flex items-center justify-between p-4">
                {/* Links: Kegelgruppe Titel */}
                <div className="flex items-center">
                    <Link href="/" className="text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-all">
                        <span className="text-xl font-semibold">Kegelgruppe KEPA 1958</span>
                    </Link>
                </div>

                {/* Desktop Navigation - versteckt auf mobilen Geräten */}
                <div className="hidden lg:flex items-center space-x-6">
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

                            {NavDataVerwaltung.map((navItem) => (
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
                                <NavigationMenuTrigger className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent rounded transition-all">Vorlagen</NavigationMenuTrigger>
                                <NavigationMenuContent className="bg-gray-800 dark:bg-gray-900 border border-gray-600 dark:border-gray-700">
                                    <ul className="grid w-[400px] gap-3 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        {NavDataVordrucke.map((category) => (
                                            <li key={category.title}>
                                                <div className="mb-2">
                                                    <div className="text-sm font-bold leading-none mb-2 text-white">
                                                        {category.title}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {category.subtitle.map((item) => (
                                                            <NavigationMenuLink key={item.subtitle} asChild>
                                                                <Link
                                                                    href={item.href}
                                                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <div className="text-sm font-medium leading-none">
                                                                        {item.subtitle}
                                                                    </div>
                                                                </Link>
                                                            </NavigationMenuLink>
                                                        ))}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>

                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>

                    <ThemeSwitcher />
                </div>

                {/* Mobile Menu Button und Theme Switcher */}
                <div className="lg:hidden flex items-center space-x-2">
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
                <div className="lg:hidden bg-gray-700 dark:bg-gray-800 border-t border-gray-600 dark:border-gray-700">
                    <nav className="flex flex-col space-y-1 p-4">
                        <Link
                            href="/"
                            className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/verwaltung"
                            className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Verwaltung
                        </Link>
                        {NavDataVerwaltung.map((navItem) => (
                            <Link
                                key={navItem.title}
                                href={navItem.href}
                                className="px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {navItem.title}
                            </Link>
                        ))}

                        {/* Vorlagen Accordion für Mobile */}
                        <div>
                            <button
                                onClick={toggleMobileVorlagen}
                                className="flex items-center justify-between w-full px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            >
                                <span>Vorlagen</span>
                                {isMobileVorlagenOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {isMobileVorlagenOpen && (
                                <div className="mt-2 ml-4 space-y-2">
                                    {NavDataVordrucke.map((category) => (
                                        <div key={category.title}>
                                            <div className="text-sm font-bold text-gray-300 mb-1 px-3">
                                                {category.title}
                                            </div>
                                            <div className="space-y-1">
                                                {category.subtitle.map((item) => (
                                                    <Link
                                                        key={item.subtitle}
                                                        href={item.href}
                                                        className="block px-3 py-1 text-sm text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                                                        onClick={() => {
                                                            setIsMobileMenuOpen(false);
                                                            setIsMobileVorlagenOpen(false);
                                                        }}
                                                    >
                                                        {item.subtitle}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all text-left"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
}