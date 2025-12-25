'use client';

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  BarChart3,
  Zap,
  Bell,
  LayoutTemplate,
  Users,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { FaNodeJs, FaPython } from "react-icons/fa";
import { ThemeToggle } from "@/components/theme-toggle";

const codeExamples = {
  curl: `curl -X POST https://api.fwd.email/v1/send \\
  -H "Authorization: Bearer fwd_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Welcome to FWD! 🎉",
    "html": "<h1>Hello!</h1><p>Thanks for joining.</p>"
  }'`,

  nodejs: `fetch("https://api.fwd.email/v1/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer fwd_xxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Welcome to FWD! 🎉",
    html: "<h1>Hello!</h1><p>Thanks for joining.</p>",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Email sent:", data));`,

  python: `import requests

response = requests.post(
    "https://api.fwd.email/v1/send",
    headers={
        "Authorization": "Bearer fwd_xxxxx",
        "Content-Type": "application/json",
    },
    json={
        "to": "user@example.com",
        "subject": "Welcome to FWD! 🎉",
        "html": "<h1>Hello!</h1><p>Thanks for joining.</p>",
    },
)
print("Email sent:", response.json())`,
};

const tabs = [
  { id: 'curl', label: 'cURL', icon: <Terminal className="w-4 h-4" /> },
  { id: 'nodejs', label: 'Node.js', icon: <FaNodeJs className="w-4 h-4 text-green-500" /> },
  { id: 'python', label: 'Python', icon: <FaPython className="w-4 h-4 text-yellow-500" /> },
];

const features = [
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Open Tracking",
    description: "Know exactly when your emails are opened with pixel-perfect tracking.",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Bounce Handling",
    description: "Automatic bounce detection and suppression list management.",
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: "Webhooks",
    description: "Real-time notifications for delivery, opens, and bounces.",
  },
  {
    icon: <LayoutTemplate className="w-8 h-8" />,
    title: "Templates",
    description: "Reusable templates with dynamic variable substitution.",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Batch Sending",
    description: "Send thousands of emails with a single API call.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Unsubscribe",
    description: "CAN-SPAM compliant unsubscribe links in every email.",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('curl');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">FWD</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                API
              </Link>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
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

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="animate-float">
              <Mail className="w-16 h-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Email for{" "}
            <span className="gradient-text">Developers</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Send transactional emails with reliable deliverability.
            A clean, modern API that fits right into your code.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-all hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              href="#api"
              className="w-full sm:w-auto px-8 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-card transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* API Showcase with Tabs */}
      <section id="api" className="py-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Email API</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Developer-first email infrastructure
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A clean, modern API for sending and tracking emails.
              Built for speed, reliability, and easy integration.
            </p>
          </div>

          {/* Code Block with Tabs */}
          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            {/* Tab Bar */}
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-background text-primary'
                    : 'bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground'
                    }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Code Content */}
            <div className="code-block h-[400px] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 overflow-x-auto min-h-full"
                >
                  <code className="text-sm text-[#cdd6f4] leading-relaxed whitespace-pre font-mono">
                    {codeExamples[activeTab as keyof typeof codeExamples]}
                  </code>
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Features</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Everything you need to send emails at scale
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Start sending better emails today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Transactional emails, batch sends, and everything in between.
              Fast, reliable, and developer-friendly.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-all hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">FWD</span>
              <span className="text-sm text-muted-foreground">— Email for developers</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <a
                href="https://github.com/sarthaklaptop/fwd"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <span>© 2024 FWD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
