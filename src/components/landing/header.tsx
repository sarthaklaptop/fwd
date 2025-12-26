'use client';

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavLink {
    href: string;
    label: string;
}

interface HeaderProps {
    navLinks?: NavLink[];
}

const defaultNavLinks: NavLink[] = [
    { href: "#features", label: "Features" },
    { href: "#api", label: "API" },
    { href: "/auth/login", label: "Login" },
];

export function Header({ navLinks = defaultNavLinks }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
            <div className="mx-auto max-w-5xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold tracking-tight">
                        <span className="gradient-text">FWD</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="font-mono uppercase text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <ThemeToggle />
                        <Link
                            href="/auth/login"
                            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
