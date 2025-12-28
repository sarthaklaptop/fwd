'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
    LayoutDashboard,
    Key,
    Webhook,
    FileCode,
    Mail,
    Send,
    BarChart3,
    LogOut,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';
import {
    Sidebar,
    SidebarBody,
    SidebarLink,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

interface DashboardSidebarProps {
    children: React.ReactNode;
    emailsToday?: number;
    dailyLimit?: number;
}

export default function DashboardSidebar({
    children,
    emailsToday = 0,
    dailyLimit = 100,
}: DashboardSidebarProps) {
    const [open, setOpen] = useState(true);
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success('Logged out successfully');
        router.push('/auth/login');
        router.refresh();
    };

    const links = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'Analytics',
            href: '/dashboard/analytics',
            icon: <BarChart3 className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'API Keys',
            href: '/dashboard/api-keys',
            icon: <Key className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'Webhooks',
            href: '/dashboard/webhooks',
            icon: <Webhook className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'Templates',
            href: '/dashboard/templates',
            icon: <FileCode className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'Batches',
            href: '/dashboard/batches',
            icon: <Send className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
        {
            label: 'Emails',
            href: '/dashboard/emails',
            icon: <Mail className="h-5 w-5 shrink-0 text-foreground/70" />,
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 bg-card border-r border-border">
                    <div className={`flex flex-col flex-1 overflow-y-auto overflow-x-hidden ${!open ? 'items-center' : ''}`}>
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 py-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                                <span className="text-primary-foreground font-bold text-lg">F</span>
                            </div>
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: open ? 1 : 0,
                                    width: open ? 'auto' : 0,
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                                className="text-xl font-bold gradient-text whitespace-pre overflow-hidden"
                            >
                                FWD
                            </motion.span>
                        </Link>

                        {/* Toggle Button */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="hidden md:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mt-2"
                            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            {open ? (
                                <PanelLeftClose className="h-5 w-5" />
                            ) : (
                                <PanelLeft className="h-5 w-5" />
                            )}
                        </button>

                        {/* Divider */}
                        <div className={`h-px bg-border my-4 ${open ? 'w-full' : 'w-8'}`} />

                        {/* Navigation Links */}
                        <div className={`flex flex-col gap-1 ${!open ? 'items-center' : 'w-full'}`}>
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className={`flex flex-col gap-2 ${!open ? 'items-center' : ''}`}>

                        {/* Divider */}
                        <div className={`h-px bg-border my-2 ${open ? 'w-full' : 'w-8'}`} />

                        {/* Daily Usage */}
                        <motion.div
                            animate={{
                                display: open ? 'block' : 'none',
                                opacity: open ? 1 : 0,
                            }}
                            className="px-1 w-full"
                        >
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Daily Usage
                            </span>
                            {(() => {
                                const usagePercent = (emailsToday / dailyLimit) * 100;
                                const getBarColor = () => {
                                    if (usagePercent >= 100) return 'bg-red-500';
                                    if (usagePercent >= 80) return 'bg-orange-500';
                                    if (usagePercent >= 50) return 'bg-yellow-500';
                                    return 'bg-green-500';
                                };
                                const getTextColor = () => {
                                    if (usagePercent >= 100) return 'text-red-500';
                                    if (usagePercent >= 80) return 'text-orange-500';
                                    if (usagePercent >= 50) return 'text-yellow-500';
                                    return 'text-green-500';
                                };
                                return (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
                                                style={{
                                                    width: `${Math.min(usagePercent, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className={`text-xs font-mono font-medium ${getTextColor()}`}>
                                            {emailsToday}/{dailyLimit}
                                        </span>
                                    </div>
                                );
                            })()}
                        </motion.div>

                        {/* Divider */}
                        <div className={`h-px bg-border my-2 ${open ? 'w-full' : 'w-8'}`} />

                        <div className="flex items-center gap-2 py-2">
                            <ThemeToggle />
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: open ? 1 : 0,
                                    width: open ? 'auto' : 0,
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                                className="text-sm text-muted-foreground whitespace-pre overflow-hidden"
                            >
                                Theme
                            </motion.span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: open ? 1 : 0,
                                    width: open ? 'auto' : 0,
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: [0.4, 0, 0.2, 1],
                                }}
                                className="text-sm whitespace-pre overflow-hidden"
                            >
                                Logout
                            </motion.span>
                        </button>
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
