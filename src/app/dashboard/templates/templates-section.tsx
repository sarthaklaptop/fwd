'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { FileText, Plus, Pencil, Trash2, Code, Variable } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
    id: string;
    name: string;
    subject: string;
    html: string;
    variables: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export default function TemplatesSection({ initialTemplates }: { initialTemplates: Template[] }) {
    const [templates, setTemplates] = useState<Template[]>(initialTemplates);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [html, setHtml] = useState('');

    const openCreateModal = () => {
        setEditingTemplate(null);
        setName('');
        setSubject('');
        setHtml('');
        setShowModal(true);
    };

    const openEditModal = (template: Template) => {
        setEditingTemplate(template);
        setName(template.name);
        setSubject(template.subject);
        setHtml(template.html);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTemplate(null);
    };

    const saveTemplate = async () => {
        if (!name.trim() || !subject.trim() || !html.trim()) return;
        setLoading(true);

        const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
        const method = editingTemplate ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, subject, html }),
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            if (editingTemplate) {
                setTemplates(templates.map(t => t.id === editingTemplate.id ? data.template : t));
                toast.success('Template updated successfully!');
            } else {
                setTemplates([data.template, ...templates]);
                toast.success('Template created successfully!');
            }
            closeModal();
        } else {
            toast.error(data.error || 'Failed to save template');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE' });
        if (res.ok) {
            setTemplates(templates.filter(t => t.id !== deleteTarget.id));
            toast.success('Template deleted');
        } else {
            toast.error('Failed to delete template');
        }
        setDeleteTarget(null);
    };

    const extractedVars = (text: string) => {
        const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
        return matches.map(m => m.replace(/\{\{|\}\}/g, '').trim());
    };

    const previewVars = [...new Set([...extractedVars(subject), ...extractedVars(html)])];

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-end">
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create Template
                </button>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-xl bg-card/50">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-foreground font-medium">No templates yet</p>
                    <p className="text-muted-foreground text-sm mt-1">Create your first template to get started</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-foreground font-medium truncate">{template.name}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(template)}
                                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm p-1 rounded hover:bg-primary/10 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(template)}
                                        className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm p-1 rounded hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm truncate mb-2">{template.subject}</p>
                            {template.variables && (
                                <div className="flex flex-wrap gap-1">
                                    {JSON.parse(template.variables).map((v: string) => (
                                        <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                            {`{{${v}}}`}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-card border border-border p-6 rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {editingTemplate ? (
                                    <Pencil className="w-5 h-5 text-primary" />
                                ) : (
                                    <FileText className="w-5 h-5 text-primary" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-foreground">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Welcome Email"
                                    className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Welcome to {{company}}, {{name}}!"
                                    className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                                    <Code className="w-4 h-4" />
                                    HTML Content
                                </label>
                                <textarea
                                    value={html}
                                    onChange={(e) => setHtml(e.target.value)}
                                    placeholder="<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>"
                                    rows={6}
                                    className="w-full px-4 py-2.5 bg-transparent border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                                />
                            </div>

                            {previewVars.length > 0 && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                        <Variable className="w-4 h-4" />
                                        Detected Variables
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {previewVars.map((v) => (
                                            <span key={v} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                                                {`{{${v}}}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={saveTemplate}
                                disabled={loading || !name.trim() || !subject.trim() || !html.trim()}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : editingTemplate ? (
                                    'Update Template'
                                ) : (
                                    'Create Template'
                                )}
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2.5 bg-transparent hover:bg-primary/10 text-foreground font-medium rounded-lg border border-border hover:border-primary/30 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
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
