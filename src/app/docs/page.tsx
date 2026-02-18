'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Header, Footer } from '@/components/landing';
import { docSections, docsNavLinks } from './docs-data';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header navLinks={docsNavLinks} />

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-primary/10">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="gradient-text">Documentation</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate FWD into your application.
              Send emails, track delivery, and manage your account programmatically.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Start Banner */}
      <section className="pb-8">
        <div className="mx-auto max-w-5xl px-6">
          <Link href="/docs/getting-started">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative p-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label text-xs text-primary mb-1">Recommended</p>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    Quick Start Guide
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Send your first email in under 5 minutes. Set up your API key and start integrating.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Sections Grid */}
      {docSections.map((section, sectionIdx) => (
        <section key={section.label} className="py-6">
          <div className="mx-auto max-w-5xl px-6">
            <p className="font-label text-xs text-muted-foreground mb-4">
              {section.label}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.pages.map((page, pageIdx) => (
                <Link key={page.slug} href={`/docs/${page.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.15 + sectionIdx * 0.05 + pageIdx * 0.05,
                    }}
                    className="group p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all h-full"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <page.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {page.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-8 text-center border border-primary/20">
            <h2 className="text-2xl font-bold mb-3">Need help?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll help you get started.
            </p>
            <Link
              href="mailto:support@fwd.sarthak.online"
              className="inline-block px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
