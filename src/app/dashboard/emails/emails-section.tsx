'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { formatRelativeTime } from '@/lib/utils';
import {
  Mail,
  RefreshCw,
  Download,
  Search,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import type {
  Email,
  EmailDetail,
  EmailDetailModalProps,
  StatusBadgeProps,
  StatusFilterDropdownProps,
} from './emails-types';
import { STATUS_OPTIONS } from './emails-types';

export default function EmailsSection() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [nextCursor, setNextCursor] = useState<
    string | null
  >(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] =
    useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmail, setSelectedEmail] =
    useState<EmailDetail | null>(null);
  const [pendingEmailId, setPendingEmailId] = useState<
    string | null
  >(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search),
      500
    );
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmails = useCallback(
    async (cursor?: string | null) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (cursor) params.set('cursor', cursor);
        if (debouncedSearch)
          params.set('search', debouncedSearch);
        if (statusFilter)
          params.set('status', statusFilter);
        params.set('limit', '20');

        const res = await fetch(`/api/emails?${params}`);
        const response = await res.json();
        if (response.success) {
          if (cursor) {
            setEmails((prev) => [
              ...prev,
              ...response.data.emails,
            ]);
          } else {
            setEmails(response.data.emails);
          }
          setNextCursor(response.data.nextCursor);
          setHasMore(response.data.hasMore);
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [debouncedSearch, statusFilter]
  );

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  async function fetchEmailDetail(email: Email) {
    setPendingEmailId(email.id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/emails/${email.id}`);
      const response = await res.json();
      if (response.success) {
        setSelectedEmail(response.data.email);
      }
    } catch (error) {
      console.error('Failed to fetch email detail:', error);
    }
    setDetailLoading(false);
  }

  function closeModal() {
    setSelectedEmail(null);
    setPendingEmailId(null);
  }

  const pendingEmail = pendingEmailId
    ? emails.find((e) => e.id === pendingEmailId)
    : null;

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(
        `/api/emails/export?${params}`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails-export-${
          new Date().toISOString().split('T')[0]
        }.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export:', error);
    }
    setExporting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => fetchEmails()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-primary/10 text-foreground text-sm font-medium rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading ? 'animate-spin' : ''
            }`}
          />
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export CSV
            </>
          )}
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
        </div>
        <StatusFilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary rounded w-32"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary rounded w-48"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 bg-secondary rounded-full w-20"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary rounded w-16"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary rounded w-20"></div>
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center"
                >
                  <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-foreground font-medium">
                    {debouncedSearch || statusFilter
                      ? 'No emails match your filters'
                      : 'No emails sent yet'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {debouncedSearch || statusFilter
                      ? 'Try adjusting your search or filters'
                      : 'Send your first email to see it here'}
                  </p>
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  onClick={() => fetchEmailDetail(email)}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {email.to}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {email.subject}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={email.status} />
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {email.openedAt
                      ? formatRelativeTime(email.openedAt)
                      : '—'}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(email.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchEmails(nextCursor)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2 bg-transparent hover:bg-primary/10 text-foreground text-sm font-medium rounded-lg border border-border hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {(selectedEmail || pendingEmailId) && (
        <EmailDetailModal
          email={selectedEmail}
          pendingEmail={pendingEmail}
          loading={detailLoading}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function EmailDetailModal({
  email,
  pendingEmail,
  loading,
  onClose,
}: EmailDetailModalProps) {
  const displayEmail = email || pendingEmail;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Email Details
              </h3>
              {displayEmail ? (
                <p className="text-muted-foreground text-sm truncate max-w-md">
                  To: {displayEmail.to}
                </p>
              ) : (
                <div className="h-4 bg-secondary rounded w-32 animate-pulse"></div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)] space-y-4">
          {loading || !email ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 bg-secondary rounded w-16 mb-2"></div>
                    <div className="h-5 bg-secondary rounded w-full"></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="h-3 bg-secondary rounded w-24 mb-2"></div>
                <div className="h-64 bg-secondary rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">
                    To
                  </p>
                  <p className="text-foreground font-medium">
                    {email.to}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    Status
                  </p>
                  <StatusBadge status={email.status} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    Subject
                  </p>
                  <p className="text-foreground font-medium">
                    {email.subject}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    Sent
                  </p>
                  <p
                    className="text-foreground"
                    suppressHydrationWarning
                  >
                    {new Date(
                      email.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
                {email.openedAt && (
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Opened
                    </p>
                    <p
                      className="text-foreground"
                      suppressHydrationWarning
                    >
                      {new Date(
                        email.openedAt
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
                {email.bounceType && (
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Bounce Type
                    </p>
                    <p className="text-red-500 dark:text-red-400 font-medium">
                      {email.bounceType}
                    </p>
                  </div>
                )}
              </div>

              {email.errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-500 dark:text-red-400 text-sm">
                    {email.errorMessage}
                  </p>
                </div>
              )}

              {email.html && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">
                    Email Content
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-border overflow-hidden">
                    <iframe
                      srcDoc={email.html}
                      className="w-full h-64 border-0"
                      title="Email preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}

              {email.text && !email.html && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">
                    Text Content
                  </p>
                  <pre className="bg-secondary rounded-lg p-4 text-foreground text-sm whitespace-pre-wrap overflow-x-auto border border-border">
                    {email.text}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<
    string,
    { bg: string; text: string; dot: string }
  > = {
    pending: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500 dark:text-yellow-400',
      dot: 'bg-yellow-500 dark:bg-yellow-400',
    },
    processing: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500 dark:text-blue-400',
      dot: 'bg-blue-500 dark:bg-blue-400 animate-pulse',
    },
    completed: {
      bg: 'bg-green-500/10',
      text: 'text-green-500 dark:text-green-400',
      dot: 'bg-green-500 dark:bg-green-400',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-500 dark:text-red-400',
      dot: 'bg-red-500 dark:bg-red-400',
    },
    bounced: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-500 dark:text-orange-400',
      dot: 'bg-orange-500 dark:bg-orange-400',
    },
    complained: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-500 dark:text-purple-400',
      dot: 'bg-purple-500 dark:bg-purple-400',
    },
  };

  const style = styles[status] || styles.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
      ></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatusFilterDropdown({
  value,
  onChange,
}: StatusFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener(
      'mousedown',
      handleClickOutside
    );
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  const selectedOption =
    STATUS_OPTIONS.find((opt) => opt.value === value) ||
    STATUS_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 px-4 py-2 min-w-[140px] bg-transparent border border-border rounded-lg text-foreground text-sm hover:bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full min-w-[160px] bg-card border border-border rounded-lg shadow-xl z-50 py-1 animate-fade-in">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                value === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-secondary/50'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
