'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { TemplateCard, EmptyState } from './templates-card';
import { TemplateModal } from './templates-modal';
import { TestEmailModal } from './templates-test-modal';
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
  const [duplicateSource, setDuplicateSource] =
    useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [testTemplate, setTestTemplate] =
    useState<Template | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Fetch user email for test modal (cached in localStorage)
  useEffect(() => {
    async function fetchUserEmail() {
      // Check cache first
      const cachedEmail = localStorage.getItem(
        'fwd_user_email'
      );
      if (cachedEmail) {
        setUserEmail(cachedEmail);
        return;
      }

      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.data.profile.email) {
          const email = data.data.profile.email;
          setUserEmail(email);
          // Cache for future mounts
          localStorage.setItem('fwd_user_email', email);
        }
      } catch {
        // Silently fail, user can type email
      }
    }
    fetchUserEmail();
  }, []);

  // Filter templates by search
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
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
      handleCreateTemplate
    );
    return () =>
      window.removeEventListener(
        'cmd:create-template',
        handleCreateTemplate
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
              No templates match "{search}"
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
