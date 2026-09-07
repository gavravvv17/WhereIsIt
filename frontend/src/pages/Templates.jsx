import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  ClipboardList,
  Plus,
  Trash2,
  BookOpen,
  X,
  Loader2,
  CheckCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Template Creator State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateItems, setTemplateItems] = useState([{ name: '', category: 'Clothing', quantity: 1, priority: 'IMPORTANT' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Selected template viewer state
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await client.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddCreatorRow = () => {
    setTemplateItems(prev => [...prev, { name: '', category: 'Clothing', quantity: 1, priority: 'IMPORTANT' }]);
  };

  const handleRemoveCreatorRow = (index) => {
    if (templateItems.length === 1) return;
    setTemplateItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatorRowChange = (index, field, value) => {
    setTemplateItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleCreateTemplateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const cleanItems = templateItems.filter(item => item.name.trim() !== '');
    if (cleanItems.length === 0) {
      setError('Please add at least one valid item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: templateName,
        description: templateDesc,
        items: cleanItems.map(item => ({
          name: item.name.trim(),
          category: item.category,
          quantity: item.quantity,
          priority: item.priority
        }))
      };

      await client.post('/templates', payload);
      
      // Reset form
      setTemplateName('');
      setTemplateDesc('');
      setTemplateItems([{ name: '', category: 'Clothing', quantity: 1, priority: 'IMPORTANT' }]);
      setShowCreateModal(false);
      
      fetchTemplates();
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation(); // Avoid opening viewer
    if (!window.confirm("Are you sure you want to delete this custom template?")) return;

    try {
      await client.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-green" />
      </div>
    );
  }

  const getPriorityColor = (p) => {
    switch (p) {
      case 'ESSENTIAL': return 'text-[#EF4444] bg-red-50 border-red-100';
      case 'IMPORTANT': return 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]';
      default: return 'text-dark-green bg-light-green border-[#A7F3D0]';
    }
  };

  return (
    <div className="space-y-6 pb-16 md:pb-8 font-sans">
      <div className="flex items-center justify-between border-b border-theme-border pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-text">Packing Templates</h1>
          <p className="text-sm text-secondary-text mt-1">Re-use pre-configured lists to speed up trip planning.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-primary-green text-white px-4 py-2.5 rounded-[12px] font-semibold hover:bg-dark-green transition-theme nav-shadow"
        >
          <Plus size={16} />
          Create Template
        </button>
      </div>

      {/* Grid of templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className="bg-white border border-theme-border rounded-[18px] shadow-sm hover:shadow-md hover:border-primary-green/20 transition-theme p-6 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  template.isCustom ? 'bg-light-green text-dark-green border border-primaryGreen/20' : 'bg-gray-100 text-secondary-text'
                }`}>
                  {template.isCustom ? 'Custom Template' : 'Preset'}
                </span>
                
                {template.isCustom && (
                  <button
                    onClick={(e) => handleDeleteTemplate(template.id, e)}
                    className="p-1 text-secondary-text hover:text-[#EF4444] hover:bg-red-50 rounded-[12px] transition-theme"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <h3 className="text-lg font-bold text-primary-text uppercase tracking-wide truncate">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-secondary-text mt-2 line-clamp-2 italic">
                  "{template.description}"
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-theme-border flex items-center justify-between text-xs text-secondary-text">
              <span className="font-semibold text-primary-green flex items-center gap-1">
                <ClipboardList size={14} />
                {template.items?.length || 0} Standard Items
              </span>
              <span className="hover:text-dark-green transition-theme flex items-center gap-1 font-bold">
                View Checklist &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Template Viewer Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark-green">{selectedTemplate.name.toUpperCase()}</h3>
                <span className="text-[10px] font-bold text-secondary-text uppercase">
                  {selectedTemplate.isCustom ? 'Custom Template' : 'System Preset'}
                </span>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-secondary-text hover:text-primary-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedTemplate.description && (
                <p className="text-xs text-secondary-text italic bg-theme-bg p-3 border border-theme-border rounded-[12px]">
                  "{selectedTemplate.description}"
                </p>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-black text-dark-green uppercase tracking-wider pl-1">Packing Checklist Items</h4>
                <div className="divide-y divide-themeBorder border border-theme-border rounded-[12px] overflow-hidden">
                  {selectedTemplate.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white hover:bg-theme-bg/40 transition-theme">
                      <div>
                        <p className="text-sm font-semibold text-primary-text">
                          {item.name}
                          {item.quantity > 1 && <span className="ml-1.5 text-xs text-secondary-text font-bold">x{item.quantity}</span>}
                        </p>
                        <span className="text-[10px] text-secondary-text bg-theme-bg px-1.5 py-0.5 rounded-full border border-theme-border uppercase">
                          {item.category}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-theme-bg px-6 py-4 border-t border-theme-border flex justify-end">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-primary-green text-white text-xs font-bold rounded-[12px] hover:bg-dark-green transition-theme"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F7D4A]/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-theme-border rounded-[18px] shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="bg-soft-mint px-6 py-4 border-b border-theme-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green flex items-center gap-2">
                <BookOpen size={20} />
                Create Custom Packing Template
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary-text hover:text-primary-text">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-[12px] p-3 text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Sailing Trip, Cycling Weekend"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">Template Description</label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Describe when to use this checklist"
                  rows="2"
                  className="block w-full border border-theme-border rounded-[11px] bg-theme-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green text-primary-text"
                ></textarea>
              </div>

              {/* Checklist items dynamic rows */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center pl-1">
                  <h4 className="text-xs font-black text-dark-green uppercase tracking-wider">Template checklist items</h4>
                  <button
                    type="button"
                    onClick={handleAddCreatorRow}
                    className="text-xs font-bold text-primary-green hover:text-dark-green flex items-center gap-1"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {templateItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-soft-mint/40 border border-theme-border p-3 rounded-[12px] relative pr-10">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleCreatorRowChange(index, 'name', e.target.value)}
                            className="block w-full border border-theme-border rounded-[11px] bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                          />
                        </div>
                        <div>
                          <select
                            value={item.category}
                            onChange={(e) => handleCreatorRowChange(index, 'category', e.target.value)}
                            className="block w-full border border-theme-border rounded-[11px] bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-secondary-text"
                          >
                            {['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Health & Essentials', 'Accessories', 'Food', 'Travel Gear', 'Entertainment', 'Other'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleCreatorRowChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="block w-full border border-theme-border rounded-[11px] bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                          />
                          <select
                            value={item.priority}
                            onChange={(e) => handleCreatorRowChange(index, 'priority', e.target.value)}
                            className="block w-full border border-theme-border rounded-[11px] bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green text-secondary-text"
                          >
                            <option value="ESSENTIAL">ESSENTIAL</option>
                            <option value="IMPORTANT">IMPORTANT</option>
                            <option value="OPTIONAL">OPTIONAL</option>
                          </select>
                        </div>
                      </div>

                      {templateItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCreatorRow(index)}
                          className="absolute right-3 text-secondary-text hover:text-[#EF4444] p-1"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-theme-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-theme-border text-sm text-secondary-text rounded-[12px] hover:bg-theme-bg transition-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-green hover:bg-dark-green text-white text-sm font-semibold rounded-[12px] transition-theme flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;

