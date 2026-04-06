'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Plus, Search, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserEmail } from '@/hooks/use-user-email';
import { TemplateCard, EmptyState } from './templates-card';
import { TemplateModal } from './templates-modal';
import { TestEmailModal } from './templates-test-modal';
import type {
  Template,
  TemplatesSectionProps,
} from './templates-types';

function toastTemplateSaved(name: string, isEdit: boolean) {
  toast(
    () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: 320, boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{isEdit ? 'Template updated' : 'Template created'}</p>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

function toastTemplateDeleted(name: string) {
  toast(
    () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: 320, boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={18} color="#ef4444" />
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Template deleted</p>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name} removed</p>
        </div>
      </div>
    ),
    { duration: 4000 },
  );
}

export default function TemplatesSection({
  initialTemplates,
}: TemplatesSectionProps) {
  const [templates, setTemplates] = useState<Template[]>(
    initialTemplates,
  );
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<Template | null>(null);
  const [duplicateSource, setDuplicateSource] =
    useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [testTemplate, setTestTemplate] =
    useState<Template | null>(null);
  const { userEmail } = useUserEmail();

  // Filter templates by search
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const openCreateModal = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  // Listen for command palette event
  useEffect(() => {
    const handleCreateTemplate = () => openCreateModal();
    window.addEventListener(
      'cmd:create-template',
      handleCreateTemplate,
    );
    return () =>
      window.removeEventListener(
        'cmd:create-template',
        handleCreateTemplate,
      );
  }, []);

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setDuplicateSource(null);
    setShowModal(true);
  };

  const duplicateTemplate = (template: Template) => {
    setEditingTemplate(null);
    setDuplicateSource(template);
    setShowModal(true);
  };

  const openTestModal = (template: Template) => {
    setTestTemplate(template);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setDuplicateSource(null);
  };

  const saveTemplate = async (
    name: string,
    subject: string,
    html: string,
  ) => {
    if (!name.trim() || !subject.trim() || !html.trim())
      return;
    setLoading(true);

    const url = editingTemplate
      ? `/api/templates/${editingTemplate.id}`
      : '/api/templates';
    const method = editingTemplate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subject, html }),
      });

      const response = await res.json();

      if (response.success) {
        if (editingTemplate) {
          setTemplates(
            templates.map((t) =>
              t.id === editingTemplate.id
                ? response.data.template
                : t,
            ),
          );
        } else {
          setTemplates([
            response.data.template,
            ...templates,
          ]);
        }
        toastTemplateSaved(name, !!editingTemplate);
        closeModal();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }

    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetName = deleteTarget.name;

    try {
      const res = await fetch(
        `/api/templates/${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const response = await res.json();
      if (response.success) {
        setTemplates(
          templates.filter((t) => t.id !== deleteTarget.id),
        );
        toastTemplateDeleted(targetName);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {filteredTemplates.length === 0 ? (
        search ? (
          <div className="text-center py-12 border border-border rounded-xl bg-card/50">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-foreground font-medium">
              No templates match &quot;{search}&quot;
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <EmptyState onCreateClick={openCreateModal} />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
              onDuplicate={duplicateTemplate}
              onSendTest={openTestModal}
            />
          ))}
        </div>
      )}

      <TemplateModal
        isOpen={showModal}
        editingTemplate={editingTemplate}
        duplicateSource={duplicateSource}
        loading={loading}
        onClose={closeModal}
        onSave={saveTemplate}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />

      <TestEmailModal
        isOpen={!!testTemplate}
        onClose={() => setTestTemplate(null)}
        template={testTemplate}
        userEmail={userEmail}
      />
    </div>
  );
}
