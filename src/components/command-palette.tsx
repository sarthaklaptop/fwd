'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Mail,
  FileText,
  Send,
  Webhook,
  Key,
  BarChart3,
  Moon,
  Sun,
  Plus,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  type Command,
  type CommandGroup as CommandGroupType,
  searchCommands,
  groupCommands,
  COMMAND_GROUPS,
} from '@/lib/command-registry';
import { useCommandPaletteKeyboard } from '@/hooks/use-command-palette';

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext =
  createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider'
    );
  }
  return context;
}

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(
    () => setIsOpen((prev) => !prev),
    []
  );

  useCommandPaletteKeyboard({
    isOpen,
    onOpen: open,
    onClose: close,
  });

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      group: 'navigation',
      icon: <LayoutDashboard className="w-4 h-4" />,
      shortcut: 'G D',
      keywords: ['home', 'overview', 'main'],
      action: () => {
        router.push('/dashboard');
        close();
      },
    },
    {
      id: 'nav-emails',
      label: 'Go to Emails',
      group: 'navigation',
      icon: <Mail className="w-4 h-4" />,
      shortcut: 'G E',
      keywords: ['mail', 'messages', 'inbox'],
      action: () => {
        router.push('/dashboard/emails');
        close();
      },
    },
    {
      id: 'nav-templates',
      label: 'Go to Templates',
      group: 'navigation',
      icon: <FileText className="w-4 h-4" />,
      shortcut: 'G T',
      keywords: ['layouts', 'designs'],
      action: () => {
        router.push('/dashboard/templates');
        close();
      },
    },
    {
      id: 'nav-batches',
      label: 'Go to Batches',
      group: 'navigation',
      icon: <Send className="w-4 h-4" />,
      shortcut: 'G B',
      keywords: ['campaigns', 'bulk', 'send'],
      action: () => {
        router.push('/dashboard/batches');
        close();
      },
    },
    {
      id: 'nav-webhooks',
      label: 'Go to Webhooks',
      group: 'navigation',
      icon: <Webhook className="w-4 h-4" />,
      shortcut: 'G W',
      keywords: ['hooks', 'events', 'notifications'],
      action: () => {
        router.push('/dashboard/webhooks');
        close();
      },
    },
    {
      id: 'nav-apikeys',
      label: 'Go to API Keys',
      group: 'navigation',
      icon: <Key className="w-4 h-4" />,
      shortcut: 'G K',
      keywords: ['keys', 'tokens', 'authentication'],
      action: () => {
        router.push('/dashboard/api-keys');
        close();
      },
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      group: 'navigation',
      icon: <BarChart3 className="w-4 h-4" />,
      shortcut: 'G A',
      keywords: ['stats', 'metrics', 'reports', 'charts'],
      action: () => {
        router.push('/dashboard/analytics');
        close();
      },
    },
    // Actions
    {
      id: 'create-template',
      label: 'Create Template',
      group: 'actions',
      icon: <Plus className="w-4 h-4" />,
      keywords: ['new', 'add', 'template', 'design'],
      action: () => {
        router.push('/dashboard/templates');
        close();
        setTimeout(
          () =>
            window.dispatchEvent(
              new CustomEvent('cmd:create-template')
            ),
          100
        );
      },
    },
    {
      id: 'new-campaign',
      label: 'New Campaign',
      group: 'actions',
      icon: <Send className="w-4 h-4" />,
      keywords: ['send', 'batch', 'bulk', 'email'],
      action: () => {
        router.push('/dashboard/batches');
        close();
        setTimeout(
          () =>
            window.dispatchEvent(
              new CustomEvent('cmd:new-campaign')
            ),
          100
        );
      },
    },
    {
      id: 'add-webhook',
      label: 'Add Webhook',
      group: 'actions',
      icon: <Webhook className="w-4 h-4" />,
      keywords: ['hook', 'endpoint', 'event'],
      action: () => {
        router.push('/dashboard/webhooks');
        close();
        setTimeout(
          () =>
            window.dispatchEvent(
              new CustomEvent('cmd:add-webhook')
            ),
          100
        );
      },
    },
    {
      id: 'create-api-key',
      label: 'Create API Key',
      group: 'actions',
      icon: <Key className="w-4 h-4" />,
      keywords: ['key', 'token', 'new'],
      action: () => {
        router.push('/dashboard/api-keys');
        close();
        setTimeout(
          () =>
            window.dispatchEvent(
              new CustomEvent('cmd:focus-api-key')
            ),
          100
        );
      },
    },
    // Settings
    {
      id: 'toggle-theme',
      label:
        theme === 'dark'
          ? 'Switch to Light Mode'
          : 'Switch to Dark Mode',
      group: 'settings',
      icon:
        theme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        ),
      keywords: [
        'theme',
        'dark',
        'light',
        'mode',
        'appearance',
      ],
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        close();
      },
    },
  ];

  return (
    <CommandPaletteContext.Provider
      value={{ isOpen, open, close, toggle }}
    >
      {children}
      <CommandPaletteModal
        isOpen={isOpen}
        onClose={close}
        commands={commands}
      />
    </CommandPaletteContext.Provider>
  );
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

function CommandPaletteModal({
  isOpen,
  onClose,
  commands,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = searchCommands(query, commands);
  const groupedCommands = groupCommands(filteredCommands);
  const flatCommands: Command[] = [];
  for (const cmds of groupedCommands.values())
    flatCommands.push(...cmds);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => setSelectedIndex(0), [query]);

  useEffect(() => {
    if (listRef.current && flatCommands.length > 0) {
      listRef.current
        .querySelector(`[data-index="${selectedIndex}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, flatCommands.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Tab':
        if (!event.shiftKey) {
          event.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, flatCommands.length - 1)
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        flatCommands[selectedIndex]?.action();
        break;
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
              />
              <kbd className="hidden sm:inline-flex px-2 py-1 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[300px] overflow-y-auto p-2"
            >
              {flatCommands.length === 0 ? (
                <EmptyState query={query} />
              ) : (
                <div className="space-y-4">
                  {Array.from(
                    groupedCommands.entries()
                  ).map(([groupKey, groupCmds]) => (
                    <CommandGroupSection
                      key={groupKey}
                      groupKey={groupKey}
                      commands={groupCmds}
                      selectedIndex={selectedIndex}
                      flatCommands={flatCommands}
                      onSelect={(cmd) => cmd.action()}
                      onHover={setSelectedIndex}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">
                      ↵
                    </kbd>
                    select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">
                    ⌘
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono">
                    K
                  </kbd>
                  toggle
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CommandGroupSectionProps {
  groupKey: CommandGroupType;
  commands: Command[];
  selectedIndex: number;
  flatCommands: Command[];
  onSelect: (command: Command) => void;
  onHover: (index: number) => void;
}

function CommandGroupSection({
  groupKey,
  commands,
  selectedIndex,
  flatCommands,
  onSelect,
  onHover,
}: CommandGroupSectionProps) {
  return (
    <div>
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {COMMAND_GROUPS[groupKey]?.label || groupKey}
      </div>
      <div className="space-y-0.5">
        {commands.map((command) => {
          const flatIndex = flatCommands.findIndex(
            (c) => c.id === command.id
          );
          const isSelected = flatIndex === selectedIndex;
          return (
            <button
              key={command.id}
              data-index={flatIndex}
              onClick={() => onSelect(command)}
              onMouseEnter={() => onHover(flatIndex)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span
                className={
                  isSelected
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }
              >
                {command.icon}
              </span>
              <span className="flex-1 text-sm font-medium">
                {command.label}
              </span>
              {command.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">
                  {command.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-8 text-center">
      <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">
        No commands found
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {query ? (
          <>
            No results for &quot;{query.slice(0, 30)}
            {query.length > 30 ? '...' : ''}&quot;
          </>
        ) : (
          'Try searching for a command'
        )}
      </p>
    </div>
  );
}
