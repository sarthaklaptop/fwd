export interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplatesSectionProps {
  initialTemplates: Template[];
}

export interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
}

export interface TemplateModalProps {
  isOpen: boolean;
  editingTemplate: Template | null;
  loading: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    subject: string,
    html: string
  ) => void;
}

export interface EmptyStateProps {
  onCreateClick: () => void;
}
