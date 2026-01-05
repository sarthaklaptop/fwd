import { motion, AnimatePresence } from 'motion/react';
import {
  Key,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { useModalKeyboard } from '@/hooks/use-modal-keyboard';
import type { NewKeyModalProps } from './api-keys-types';

export function NewKeyModal({
  newKey,
  onClose,
}: NewKeyModalProps) {
  const [copied, setCopied] = useState(false);

  useModalKeyboard({ onClose, isOpen: true });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card border border-border p-6 rounded-xl max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Your New API Key
          </h3>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
            Copy this key now! It won&apos;t be shown again.
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-lg mb-4 font-mono text-sm text-green-600 dark:text-green-400 break-all border border-border">
          {newKey}
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium rounded-lg transition-all ${
              copied
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.div
                  key="copied"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Copied!
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Key
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
