import { ChevronRight } from "lucide-react";
import { FaXTwitter, FaGithub } from "react-icons/fa6";

// Fancy Button Component
interface FancyButtonProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    glowColor: 'sky' | 'emerald';
}

function FancyButton({ href, icon, label, glowColor }: FancyButtonProps) {
    const glowStyles = {
        sky: {
            radial: "bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)]",
            line: "from-sky-400/0 via-sky-400/90 to-sky-400/0",
        },
        emerald: {
            radial: "bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(52,211,153,0.6)_0%,rgba(52,211,153,0)_75%)]",
            line: "from-emerald-400/0 via-emerald-400/90 to-emerald-400/0",
        },
    };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block cursor-pointer rounded-full bg-slate-800 p-px text-xs font-semibold leading-6 text-white no-underline shadow-2xl shadow-zinc-900"
        >
            <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className={`absolute inset-0 rounded-full ${glowStyles[glowColor].radial} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
            </span>
            <div className="relative z-10 flex items-center space-x-2 rounded-full bg-zinc-950 px-4 py-1.5 ring-1 ring-white/10">
                {icon}
                <span>{label}</span>
                <ChevronRight className="w-4 h-4" />
            </div>
            <span className={`absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r ${glowStyles[glowColor].line} transition-opacity duration-500 group-hover:opacity-40`} />
        </a>
    );
}

interface FooterProps {
    twitterHandle?: string;
    githubUrl?: string;
}

export function Footer({
    twitterHandle = "Sarthak10007",
    githubUrl = "https://github.com/sarthaklaptop/fwd",
}: FooterProps) {
    return (
        <footer className="py-16 border-t border-border">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-col items-center text-center gap-8">
                    {/* Logo & Tagline */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-2xl font-bold gradient-text">FWD</span>
                        <p className="text-muted-foreground">
                            Built by a developer, for developers.
                        </p>
                    </div>

                    {/* Social Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <FancyButton
                            href={`https://x.com/${twitterHandle}`}
                            icon={<FaXTwitter className="w-4 h-4" />}
                            label={`Follow @${twitterHandle}`}
                            glowColor="sky"
                        />
                        <FancyButton
                            href={githubUrl}
                            icon={<FaGithub className="w-4 h-4" />}
                            label="Star on GitHub"
                            glowColor="emerald"
                        />
                    </div>

                    {/* Footer Links */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>© {new Date().getFullYear()} FWD</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
