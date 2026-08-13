import React, { useState, useEffect } from 'react';
import { Edit, Copy, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import NewCreditRuleModal from '../../../components/modals/NewCreditRuleModal';
import api from '../../../services/api';

export default function CreditRulesTab({ isModalOpen, setIsModalOpen }) {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/credit-rules');
      setRules(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load credit rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.patch(`/admin/credit-rules/${id}/status`, { 
        isActive: newStatus
      });
      setRules(prev => prev.map(rule => {
        if (rule.id === id) {
          return { ...rule, enabled: newStatus };
        }
        return rule;
      }));
      toast.success(`Rule ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update rule status');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingRule(null), 200); // Wait for modal exit animation
  };

  const handleSaveRule = (savedRule) => {
    setRules(prev => {
      const exists = prev.find(r => r.id === savedRule.id);
      if (exists) {
        return prev.map(r => r.id === savedRule.id ? savedRule : r);
      }
      return [savedRule, ...prev];
    });
  };

  return (
    <div className="w-full h-full">
      {/* 2-Column Responsive Grid */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-2xl">
          No credit rules found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map((rule) => (
          <div 
            key={rule.id} 
            className="bg-white rounded-[20px] shadow-sm flex flex-col w-full overflow-hidden"
          >
            <div className="p-6 flex flex-col flex-1">
              
              {/* Header: Title, Pill, Toggle */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-black font-heading leading-tight">{rule.title}</h3>
                  {rule.enabled && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E7F2E9] text-[#127C2F]">
                      <span className="w-1.5 h-1.5 bg-[#127C2F] rounded-full mr-1.5"></span>
                      Active
                    </span>
                  )}
                </div>
                {/* Toggle Switch */}
                <button 
                  onClick={() => handleToggleActive(rule.id, rule.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${rule.enabled ? 'bg-[#127C2F]' : 'bg-[#D1D5DB]'}`}
                  aria-label={`Toggle ${rule.title}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${(rule.isActive || rule.enabled) ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                  />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-paragraph mb-6 min-h-[40px]">
                {rule.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="bg-[#F9FAFB] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-paragraph mb-1">Award</span>
                  <span className="text-lg font-bold text-black font-heading">+{rule.credits ?? rule.award ?? 0}</span>
                </div>
                <div className="bg-[#FFFDF5] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-paragraph mb-1">Multiplier</span>
                  <span className="text-lg font-bold text-black font-heading">{rule.multiplier ?? 1}x</span>
                </div>
                <div className="bg-[#F0FDF4] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-paragraph mb-1">Daily cap</span>
                  <span className="text-lg font-bold text-black font-heading">{rule.dailyCap ?? 'N/A'}</span>
                </div>
                <div className="bg-[#F3F4F6] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-paragraph mb-1">Monthly cap</span>
                  <span className="text-lg font-bold text-black font-heading">{rule.monthlyCap ?? 'N/A'}</span>
                </div>
              </div>

              {/* Monthly Cap Usage Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-paragraph font-medium">Monthly cap usage</span>
                  <span className="text-[13px] text-paragraph font-bold">{rule.monthlyCapUsage ?? 0}%</span>
                </div>
                <div 
                  className="w-full bg-[#E5E7EB] rounded-full h-2" 
                  role="progressbar" 
                  aria-valuenow={rule.monthlyCapUsage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${rule.monthlyCapUsage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-auto space-y-1 mb-6">
                <p className="text-[13px] text-paragraph">
                  Trigger: {rule.trigger} · Applies to: {rule.appliesTo}
                </p>
                <p className="text-[13px] text-paragraph">
                  Updated {rule.updatedAt} by {rule.updatedBy}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button 
                  onClick={() => {
                    setEditingRule(rule);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-[#127C2F] bg-[#E9FFEA] rounded-lg hover:bg-[#E9FFEA]/80 transition-colors w-full"
                >
                  <Edit className="w-4 h-4" /> Edit Rule
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
      )}

      <NewCreditRuleModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSaveRule}
        editRule={editingRule}
      />
    </div>
  );
}
