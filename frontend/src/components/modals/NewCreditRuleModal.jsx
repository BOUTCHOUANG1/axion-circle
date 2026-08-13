import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function NewCreditRuleModal({ isOpen, onClose, onSuccess, editRule = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    trigger: 'REPORT_SUBMITTED',
    appliesTo: 'ALL',
    award: 15,
    multiplier: 1,
    dailyCap: 20,
    monthlyCap: 300,
    description: '',
    enabled: true
  });

  // Reset form or populate on open
  useEffect(() => {
    if (isOpen) {
      if (editRule) {
        setFormData({
          title: editRule.title || '',
          trigger: editRule.trigger || 'REPORT_SUBMITTED',
          appliesTo: editRule.appliesTo || 'ALL',
          award: editRule.award || 15,
          multiplier: editRule.multiplier || 1,
          dailyCap: editRule.dailyCap || 20,
          monthlyCap: editRule.monthlyCap || 300,
          description: editRule.description || '',
          enabled: editRule.enabled !== false // Default true
        });
      } else {
        setFormData({
          title: '',
          trigger: 'REPORT_SUBMITTED',
          appliesTo: 'ALL',
          award: 15,
          multiplier: 1,
          dailyCap: 20,
          monthlyCap: 300,
          description: '',
          enabled: true
        });
      }
    }
  }, [isOpen, editRule]);

  // Focus trap and escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        award: parseInt(formData.award, 10),
        credits: parseInt(formData.award, 10),
        multiplier: parseFloat(formData.multiplier),
        dailyCap: parseInt(formData.dailyCap, 10),
        monthlyCap: parseInt(formData.monthlyCap, 10),
        name: formData.title,
        status: formData.enabled ? 'ACTIVE' : 'INACTIVE',
      };

      if (editRule && editRule.id && !editRule.isDuplicate) {
        await api.put(`/admin/credit-rules/${editRule.id}`, payload);
      } else {
        await api.post('/admin/credit-rules', payload);
      }
      
      toast.success(editRule && editRule.id && editRule.isDuplicate !== true ? 'Rule updated successfully' : 'Rule created successfully');
      
      if (onSuccess) {
        // Pass back the created/updated rule
        onSuccess({
          ...formData,
          id: (editRule && editRule.id && !editRule.isDuplicate) ? editRule.id : Math.random().toString(36).substr(2, 9),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin User',
          monthlyCapUsage: (editRule && editRule.monthlyCapUsage) || 0
        });
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save credit rule. You may only be able to update existing rules.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-full max-w-[500px] bg-white rounded-2xl shadow-xl z-[101] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white-stroke">
          <h2 id="modal-title" className="text-xl font-bold text-black font-heading">
            {editRule && editRule.id && !editRule.isDuplicate ? 'Edit Credit Rule' : 'New Credit rule'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-black-icon hover:text-black transition-colors rounded-lg p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <form id="credit-rule-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-black mb-1.5">Rule Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Report Submitted"
                className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="trigger" className="block text-sm font-semibold text-black mb-1.5">Trigger</label>
                <div className="relative">
                  <select
                    id="trigger"
                    name="trigger"
                    value={formData.trigger}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-paragraph text-sm focus:outline-none focus:border-primary transition-colors appearance-none pr-10"
                  >
                    <option value="REPORT_SUBMITTED">Report Submitted</option>
                    <option value="REPORT_ACKNOWLEDGED">Report Acknowledged</option>
                    <option value="REPORT_RESOLVED">Report Resolved</option>
                    <option value="USER_FIRST_REPORT">User First Report</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-black-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="appliesTo" className="block text-sm font-semibold text-black mb-1.5">Applies To</label>
                <div className="relative">
                  <select
                    id="appliesTo"
                    name="appliesTo"
                    value={formData.appliesTo}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-paragraph text-sm focus:outline-none focus:border-primary transition-colors appearance-none pr-10"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
                    <option value="BLOCKED_DRAIN">Blocked Drain</option>
                    <option value="STREET_LITTER">Street Litter</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-black-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="award" className="block text-sm font-semibold text-black mb-1.5">Credits Awarded</label>
                <input
                  type="number"
                  id="award"
                  name="award"
                  min="0"
                  required
                  value={formData.award}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label htmlFor="multiplier" className="block text-sm font-semibold text-black mb-1.5">Multiplier</label>
                <input
                  type="number"
                  id="multiplier"
                  name="multiplier"
                  min="0"
                  step="0.1"
                  required
                  value={formData.multiplier}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dailyCap" className="block text-sm font-semibold text-black mb-1.5">Daily Cap</label>
                <input
                  type="number"
                  id="dailyCap"
                  name="dailyCap"
                  min="0"
                  required
                  value={formData.dailyCap}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label htmlFor="monthlyCap" className="block text-sm font-semibold text-black mb-1.5">Monthly Cap</label>
                <input
                  type="number"
                  id="monthlyCap"
                  name="monthlyCap"
                  min="0"
                  required
                  value={formData.monthlyCap}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-black mb-1.5">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="describe the rule"
                className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-white-stroke rounded-xl">
                <span className="text-sm font-semibold text-black">Rule enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enabled"
                    className="sr-only peer"
                    checked={formData.enabled}
                    onChange={handleChange}
                  />
                  <div className="w-11 h-6 bg-white-stroke peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white-stroke flex items-center justify-end gap-3 bg-white rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-white-stroke text-sm font-semibold text-black hover:bg-white-bg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="credit-rule-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Rule'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
