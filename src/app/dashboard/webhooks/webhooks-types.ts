export interface WebhookData {
  id: string;
  url: string;
  events: string[];
  secret: string;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  responseStatus: number;
  createdAt: Date;
}

export interface AvailableEvent {
  id: string;
  label: string;
}

export interface WebhooksSectionProps {
  initialWebhooks: WebhookData[];
}

export interface WebhookCardProps {
  webhook: WebhookData;
  loading: boolean;
  onViewLogs: (webhook: WebhookData) => void;
  onTest: (webhookId: string) => void;
  onDelete: (webhook: WebhookData) => void;
  onCopySecret: (secret: string) => void;
}

export interface WebhookModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSave: (url: string, events: string[]) => void;
}

export interface LogsModalProps {
  webhook: WebhookData | null;
  logs: WebhookEvent[];
  loading: boolean;
  onClose: () => void;
}

export const AVAILABLE_EVENTS: AvailableEvent[] = [
  { id: 'email.sent', label: 'Email Sent' },
  { id: 'email.delivered', label: 'Email Delivered' },
  { id: 'email.opened', label: 'Email Opened' },
  { id: 'email.bounced', label: 'Email Bounced' },
  { id: 'email.complained', label: 'Spam Complaint' },
];
