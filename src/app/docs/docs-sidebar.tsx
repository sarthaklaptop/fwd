'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { docSections } from './docs-data';

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentSlug = pathname.replace('/docs/', '').replace('/docs', '');

  const sidebarContent = (
    <nav className="space-y-6">
      {docSections.map((section) => (
        <div key={section.label}>
          <p className="font-label text-[10px] text-muted-foreground mb-2 px-3">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.pages.map((page) => {
              const isActive = currentSlug === page.slug;
              return (
                <li key={page.slug}>
                  <Link
                    href={`/docs/${page.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <page.icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`} />
                    <span>{page.title}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-[73px] max-h-[calc(100vh-73px)] overflow-y-auto py-8 pr-4">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-[73px] z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 w-full px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          Documentation Menu
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-b border-border bg-background"
          >
            <div className="px-6 py-4">
              {sidebarContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
