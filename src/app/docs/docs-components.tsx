'use client';

import { useState } from 'react';
import { Copy, Check, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CodeBlock({
  code,
  language = 'bash',
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden my-4 code-block">
      {title && (
        <div className="px-4 py-2.5 border-b border-[#313244] flex items-center justify-between">
          <span className="text-xs font-mono text-[#a6adc8]">{title}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#cdd6f4] bg-[#313244] hover:bg-[#45475a] rounded-lg transition-colors cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span>Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm text-[#cdd6f4] leading-relaxed whitespace-pre font-mono">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function EndpointBadge({
  method,
  path,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
}) {
  const colors = {
    GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="flex items-center gap-3 my-4 p-3 rounded-xl border border-border bg-card font-mono text-sm">
      <span
        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${colors[method]}`}
      >
        {method}
      </span>
      <span className="text-foreground">{path}</span>
    </div>
  );
}

export function ParamTable({
  params,
}: {
  params: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
}) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Parameter</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Required</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}
            >
              <td className="py-3 px-4 font-mono text-primary text-xs">{p.name}</td>
              <td className="py-3 px-4 font-mono text-muted-foreground text-xs">{p.type}</td>
              <td className="py-3 px-4">
                {p.required ? (
                  <span className="text-xs font-medium text-amber-500">Required</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResponseTable({
  fields,
}: {
  fields: { name: string; type: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Field</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr
              key={f.name}
              className={i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}
            >
              <td className="py-3 px-4 font-mono text-primary text-xs">{f.name}</td>
              <td className="py-3 px-4 font-mono text-muted-foreground text-xs">{f.type}</td>
              <td className="py-3 px-4 text-muted-foreground">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'tip';
  title?: string;
  children: React.ReactNode;
}) {
  const config = {
    info: {
      icon: Info,
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-500',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-500',
    },
    tip: {
      icon: Lightbulb,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-500',
    },
  };

  const c = config[type];
  const Icon = c.icon;

  return (
    <div className={`my-4 p-4 rounded-xl border ${c.border} ${c.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${c.iconColor}`} />
        <div className="min-w-0">
          {title && (
            <p className={`font-semibold text-sm mb-1 ${c.titleColor}`}>{title}</p>
          )}
          <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border">
      {children}
    </h2>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">
      {children}
    </h3>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-muted text-primary text-sm font-mono">
      {children}
    </code>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
  );
}
