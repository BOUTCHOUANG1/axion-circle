import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ArrowRight, Trash2, X, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import NewRewardModal from '../../../components/modals/NewRewardModal';
import api from '../../../services/api';

export default function RewardCatalogTab({ isModalOpen, setIsModalOpen }) {
  const [rewards, setRewards] = useState([]);
  const [partnerStores, setPartnerStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const [resRewards, resStores] = await Promise.all([
        api.get('/admin/rewards'),
        api.get('/admin/partner-stores')
      ]);
      setRewards(resRewards.data?.data || []);
      setPartnerStores(resStores.data?.data || []);
    } catch (error) {
      toast.error('Failed to load reward catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);
  
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  
  const [page, setPage] = useState(0);
  const totalPages = 1;

  const handleEdit = (reward) => {
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingReward(null), 200);
  };

  const handleSaveReward = (savedReward) => {
    setRewards(prev => {
      const exists = prev.find(r => r.id === savedReward.id);
      if (exists) {
        return prev.map(r => r.id === savedReward.id ? savedReward : r);
      }
      return [savedReward, ...prev];
    });
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await api.delete(`/admin/rewards/${itemToDelete.id}`);
        setRewards(prev => prev.filter(r => r.id !== itemToDelete.id));
        toast.success('Reward deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete reward');
      } finally {
        setItemToDelete(null);
      }
    }
  };

  const filteredRewards = rewards.filter(rew => {
    const storeObj = partnerStores.find(s => s.id === rew.partner_store_id || s.id === rew.partnerStore?.id);
    const storeName = rew.partnerStore?.name || storeObj?.name || (typeof rew.store === 'object' ? rew.store?.name : rew.store) || '';
    return (rew.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
           storeName.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm flex flex-col w-full h-full relative">
      <div className="p-4 sm:p-5 border-b border-white-stroke flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-heading font-bold text-lg text-black">Reward Catalog</h2>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black-icon" />
          <input 
            type="text" 
            placeholder="Search catalog" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-white-stroke bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-white border-b border-white-stroke text-xs font-semibold text-paragraph h-[44px]">
              <th className="px-4 py-3 whitespace-nowrap">Reward Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Credits Required</th>
              <th className="px-4 py-3 whitespace-nowrap">Partner Store</th>
              <th className="px-4 py-3 whitespace-nowrap">Redemption Limit</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white-stroke text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : filteredRewards.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-paragraph">
                  No rewards found in catalog.
                </td>
              </tr>
            ) : (
              filteredRewards.map((rew) => (
                <tr key={rew.id} className="hover:bg-white-bg/50 transition-colors bg-white h-[72px]">
                  <td className="px-4 py-4">
                    <span className={`font-bold text-[#1F2937] text-sm ${rew.isDiscounted || rew.status === 'Draft' ? 'line-through text-opacity-60' : ''}`}>
                      {rew.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-sm text-primary">
                    {((rew.creditsRequired ?? rew.credits) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                    {rew.partnerStore?.name || partnerStores.find(s => String(s.id) === String(rew.partner_store_id))?.name || (typeof rew.store === 'object' ? rew.store?.name : rew.store) || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                    {rew.quantityAvailable ?? 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!rew.isActive ? 'bg-[#F59E0B]' : 'bg-[#127C2F]'}`}></span>
                      <span className={`text-[13px] font-bold ${!rew.isActive ? 'text-[#F59E0B]' : 'text-[#127C2F]'}`}>
                        {rew.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(rew)}
                        className="p-2 text-black-icon hover:text-primary transition-colors focus:outline-none bg-white-bg rounded-lg"
                        title="Edit Reward"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(rew)}
                        className="p-2 text-alert-error hover:bg-alert-errorLight transition-colors focus:outline-none bg-white-bg rounded-lg"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 sm:p-5 border-t border-white-stroke flex items-center justify-between">
        <button 
          disabled={page === 0}
          onClick={() => setPage(p => Math.max(0, p - 1))}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        
        <div className="flex items-center justify-center flex-1 gap-1 hidden sm:flex">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors bg-[#127C2F] text-white shadow-sm"
          >
            1
          </button>
        </div>

        <button 
          disabled={page >= totalPages - 1}
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-black">Delete Reward?</h3>
              <button onClick={() => setItemToDelete(null)} className="text-black-icon hover:bg-white-bg p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-paragraph text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-black">"{itemToDelete.name}"</span>? This action cannot be undone and will remove it from the catalog immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-white-stroke font-bold text-sm text-black hover:bg-white-bg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-alert-error font-bold text-sm text-white hover:bg-[#DC2626] transition-colors shadow-sm"
              >
                Delete Reward
              </button>
            </div>
          </div>
        </div>
      )}

      <NewRewardModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSaveReward}
        editReward={editingReward}
      />
    </div>
  );
}
