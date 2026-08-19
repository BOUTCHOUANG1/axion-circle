import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomSelect from '../common/CustomSelect';

export default function NewRewardModal({ isOpen, onClose, onSuccess, editReward = null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerStores, setPartnerStores] = useState([]);
  const modalRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    creditsRequired: 400,
    status: 'ACTIVE',
    partnerId: '',
    stock: 60,
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/admin/partner-stores')
        .then(res => setPartnerStores(res.data?.data || []))
        .catch(err => console.error('Failed to load partner stores', err));
    }
  }, [isOpen]);

  // Reset form or populate on open
  useEffect(() => {
    if (isOpen) {
      if (editReward) {
        setFormData({
          name: editReward.name || '',
          creditsRequired: editReward.creditsRequired || 400,
          status: editReward.status || 'ACTIVE',
          partnerId: editReward.partnerId || '',
          stock: editReward.stock || 60,
          description: editReward.description || ''
        });
      } else {
        setFormData({
          name: '',
          creditsRequired: 400,
          status: 'ACTIVE',
          partnerId: partnerStores.length > 0 ? partnerStores[0].id : '',
          stock: 60,
          description: ''
        });
      }
    }
  }, [isOpen, editReward, partnerStores.length]);

  // Focus trap and escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let savedReward;
      const payload = {
        ...formData,
        quantityAvailable: formData.stock,
        isActive: formData.status === 'ACTIVE',
        partner_store_id: formData.partnerId
      };
      
      if (editReward && editReward.id) {
        const res = await api.put(`/admin/rewards/${editReward.id}`, payload);
        savedReward = res.data?.data;
      } else {
        const res = await api.post('/admin/rewards', payload);
        savedReward = res.data?.data;
      }
      
      toast.success(editReward && editReward.id ? 'Reward updated successfully' : 'Reward created successfully');
      
      if (onSuccess) {
        const selectedStore = partnerStores.find(s => String(s.id) === String(payload.partner_store_id));
        const finalReward = {
          ...payload,
          ...savedReward,
          partnerStore: savedReward?.partnerStore || (selectedStore ? { id: selectedStore.id, name: selectedStore.name } : null)
        };
        onSuccess(finalReward);
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reward');
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
        aria-labelledby="reward-modal-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] sm:w-full max-w-[500px] bg-white rounded-2xl shadow-xl z-[101] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white-stroke">
          <h2 id="reward-modal-title" className="text-xl font-bold text-black font-heading">
            {editReward && editReward.id ? 'Edit Reward' : 'New Reward'}
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
          <form id="reward-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-black mb-1.5">Reward Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Free Data"
                className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="creditsRequired" className="block text-sm font-semibold text-black mb-1.5">Credits Required</label>
                <input
                  type="number"
                  id="creditsRequired"
                  name="creditsRequired"
                  min="0"
                  required
                  value={formData.creditsRequired}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-black mb-1.5">Status</label>
                <CustomSelect
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'DRAFT', label: 'Draft' }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="partnerId" className="block text-sm font-semibold text-black mb-1.5">Partner</label>
                <CustomSelect
                  id="partnerId"
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={handleChange}
                  placeholder="Select a partner"
                  options={
                    partnerStores.length === 0 
                      ? [{ value: '', label: 'No partners found' }] 
                      : partnerStores.map(p => ({ value: p.id, label: p.name }))
                  }
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-semibold text-black mb-1.5">Stock</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  min="0"
                  required
                  value={formData.stock}
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
                placeholder="describe the reward"
                className="w-full px-4 py-2.5 bg-white border border-white-stroke rounded-xl text-black text-sm focus:outline-none focus:border-primary transition-colors resize-none"
              />
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
            form="reward-form"
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
              'Save Reward'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
