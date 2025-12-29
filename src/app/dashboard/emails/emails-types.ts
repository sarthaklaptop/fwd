// Emails types

export interface Email {
  id: string;
  to: string;
  subject: string;
  status: string;
  openedAt: Date | null;
  createdAt: Date;
}

export interface EmailDetail {
  id: string;
  to: string;
  subject: string;
  html: string | null;
  text: string | null;
  status: string;
  bounceType: string | null;
  sesMessageId: string | null;
  errorMessage: string | null;
  openedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailsTableProps {
  emails: Email[];
}

export interface StatusBadgeProps {
  status: string;
}

export interface EmailDetailModalProps {
  email: EmailDetail | null;
  pendingEmail: Email | null | undefined;
  loading: boolean;
  onClose: () => void;
}

export interface StatusFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export interface StatusOption {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Delivered' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'complained', label: 'Complained' },
];
