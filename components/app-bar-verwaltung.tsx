'use client';

import { useState } from 'react';
import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {NavDataVerwaltung} from "@/data/navdata-verwaltung";
import {LogOut, Menu, User, X} from 'lucide-react';
import {useAuthContext} from "@/providers/auth-context-provider";
import {useRouter} from "next/navigation";
import axios from 'axios';

export default function AppBarVerwaltung() {
    const {setIsLogin, userId, setUserId, username, setUsername, vorname, nachname, setVorname, setNachname, isAdmin, setIsAdmin} = useAuthContext();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await axios.post("/api/logout");
            setIsLogin(false);
            setUserId(null);
            setUsername(null);
            setVorname(null);
            setNachname(null);
            setIsAdmin(false);
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

                        </NavigationMenuList>
                    </NavigationMenu>

                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                                    <div className="flex items-center space-x-2">
                                        <User size={20} />
                                        <span>{vorname && nachname ? `${vorname} ${nachname}` : (username || 'Benutzer')}</span>
                                    </div>
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-[150px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    <div className="flex flex-col p-2 space-y-1">
                                        <NavigationMenuLink asChild>
                                            <Link
                                                href="/verwaltung/profil"
                                                className="flex flex-row items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all w-full"
                                            >
                                                <User size={18} />
                                                <span>Profil</span>
                                            </Link>
                                        </NavigationMenuLink>
                                        {isAdmin && (
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    href="/verwaltung/benutzerzugriff"
                                                    className="flex flex-row items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all w-full"
                                                >
                                                    <User size={18} />
                                                    <span>Benutzerzugriff</span>
                                                </Link>
                                            </NavigationMenuLink>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all w-full text-left"
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

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

                        <div className="border-t border-gray-600 dark:border-gray-700 my-1"></div>

                        <div className="px-3 py-2 text-gray-400 text-sm font-medium">
                            Angemeldet als: {vorname && nachname ? `${vorname} ${nachname}` : (username || 'Benutzer')}
                        </div>

                        <Link
                            href="/verwaltung/profil"
                            className="flex items-center space-x-2 px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <User size={20} />
                            <span>Profil</span>
                        </Link>

                        {isAdmin && (
                            <Link
                                href="/verwaltung/benutzerzugriff"
                                className="flex items-center space-x-2 px-3 py-2 text-white hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <User size={20} />
                                <span>Benutzerzugriff</span>
                            </Link>
                        )}

                        <button
                            onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-red-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all text-left"
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