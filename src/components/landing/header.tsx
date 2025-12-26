'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
            <div className="mx-auto max-w-5xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-2xl font-bold tracking-tight">
                        <span className="gradient-text">FWD</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-4">
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

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-3 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Menu className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.nav
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden overflow-hidden"
                        >
                            <div className="flex flex-col gap-2 pt-4 pb-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-mono uppercase text-xs font-medium px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/auth/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-sm px-4 py-2.5 mt-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
