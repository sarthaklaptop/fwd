'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { TemplateCard, EmptyState } from './templates-card';
import { TemplateModal } from './templates-modal';
import type {
  Template,
  TemplatesSectionProps,
} from './templates-types';

export default function TemplatesSection({
  initialTemplates,
}: TemplatesSectionProps) {
  const [templates, setTemplates] = useState<Template[]>(
    initialTemplates
  );
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const saveTemplate = async (
    name: string,
    subject: string,
    html: string
  ) => {
    if (!name.trim() || !subject.trim() || !html.trim())
      return;
    setLoading(true);

    const url = editingTemplate
      ? `/api/templates/${editingTemplate.id}`
      : '/api/templates';
    const method = editingTemplate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, html }),
    });

    const response = await res.json();
    setLoading(false);

    if (response.success) {
      if (editingTemplate) {
        setTemplates(
          templates.map((t) =>
            t.id === editingTemplate.id
              ? response.data.template
              : t
          )
        );
      } else {
        setTemplates([
          response.data.template,
          ...templates,
        ]);
      }
      toast.success(response.message);
      closeModal();
    } else {
      toast.error(response.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const res = await fetch(
      `/api/templates/${deleteTarget.id}`,
      { method: 'DELETE' }
    );
    const response = await res.json();
    if (response.success) {
      setTemplates(
        templates.filter((t) => t.id !== deleteTarget.id)
      );
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState onCreateClick={openCreateModal} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <TemplateModal
        isOpen={showModal}
        editingTemplate={editingTemplate}
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
    </div>
  );
}
