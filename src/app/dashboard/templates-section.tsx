'use client';

import { useState } from 'react';
import { ConfirmDialog, Toast } from '@/components/ui';

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
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
                setToast({ message: 'Template updated successfully!', type: 'success' });
            } else {
                setTemplates([data.template, ...templates]);
                setToast({ message: 'Template created successfully!', type: 'success' });
            }
            closeModal();
        } else {
            setToast({ message: data.error || 'Failed to save template', type: 'error' });
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE' });
        if (res.ok) {
            setTemplates(templates.filter(t => t.id !== deleteTarget.id));
            setToast({ message: 'Template deleted', type: 'success' });
        } else {
            setToast({ message: 'Failed to delete template', type: 'error' });
        }
        setDeleteTarget(null);
    };

    const extractedVars = (text: string) => {
        const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
        return matches.map(m => m.replace(/\{\{|\}\}/g, '').trim());
    };

    const previewVars = [...new Set([...extractedVars(subject), ...extractedVars(html)])];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Email Templates</h2>
                    <p className="text-gray-400 text-sm">Reusable templates with variable substitution</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                    + Create Template
                </button>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-400">No templates yet</p>
                    <p className="text-gray-500 text-sm">Create your first template to get started</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-medium truncate">{template.name}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(template)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                                    <button onClick={() => setDeleteTarget(template)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm truncate mb-2">{template.subject}</p>
                            {template.variables && (
                                <div className="flex flex-wrap gap-1">
                                    {JSON.parse(template.variables).map((v: string) => (
                                        <span key={v} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Welcome Email"
                                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Welcome to {{company}}, {{name}}!"
                                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">HTML Content</label>
                                <textarea
                                    value={html}
                                    onChange={(e) => setHtml(e.target.value)}
                                    placeholder="<h1>Hello {{name}}</h1><p>Welcome to {{company}}!</p>"
                                    rows={6}
                                    className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                                />
                            </div>

                            {previewVars.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Detected Variables</label>
                                    <div className="flex flex-wrap gap-2">
                                        {previewVars.map((v) => (
                                            <span key={v} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
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
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
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

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
