import ThemeSwitcher from "@/components/theme-switcher";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {NavData} from "@/data/navdata";

export default function AppBar() {
    return (
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-gray-800 text-white shadow-md">
            {/* Links: Kegelgruppe Titel */}
            <div className="flex items-center">
                <Link href="/" className="text-white hover:text-gray-600 transition-colors">
                    <span className="text-xl font-semibold">Kegelgruppe KEPA 1958</span>
                </Link>
            </div>

            {/* Rechts: Navigation und Theme Switcher */}
            <div className="flex items-center space-x-6">
                <NavigationMenu>
                    <NavigationMenuList className="flex space-x-4">
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/"
                                    className="px-3 py-2 text-white hover:text-gray-600 transition-colors"
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
                                        className="px-3 py-2 text-white hover:text-gray-600 transition-colors"
                                    >
                                        {navItem.title}
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                <ThemeSwitcher />
            </div>
        </div>
    );
}