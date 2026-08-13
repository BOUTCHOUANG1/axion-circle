import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ArrowRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AddPartnerStoreModal from '../../../components/modals/AddPartnerStoreModal';
import api from '../../../services/api';

export default function PartnerStoresTab({ isModalOpen, setIsModalOpen }) {
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStore, setEditingStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/partner-stores');
      setStores(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load partner stores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);
  
  const [page, setPage] = useState(0);
  const totalPages = 1;

  const handleEdit = (store) => {
    setEditingStore(store);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingStore(null), 200);
  };

  const handleSaveStore = (savedStore) => {
    setStores(prev => {
      const exists = prev.find(s => s.id === savedStore.id);
      if (exists) {
        return prev.map(s => s.id === savedStore.id ? savedStore : s);
      }
      return [savedStore, ...prev];
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const isSuspended = currentStatus?.toUpperCase() === 'SUSPENDED';
      const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
      await api.patch(`/admin/partner-stores/${id}/status`, { status: newStatus });
      setStores(prev => prev.map(store => {
        if (store.id === id) {
          return { ...store, status: newStatus };
        }
        return store;
      }));
      toast.success(`Store ${isSuspended ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update store status');
    }
  };

  const confirmDelete = (id) => {
    setStoreToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!storeToDelete) return;
    try {
      await api.delete(`/admin/partner-stores/${storeToDelete}`);
      setStores(prev => prev.filter(store => store.id !== storeToDelete));
      toast.success('Store deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    } finally {
      setIsDeleteModalOpen(false);
      setStoreToDelete(null);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    store.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm flex flex-col w-full h-full">
      <div className="p-4 sm:p-5 border-b border-white-stroke flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-heading font-bold text-lg text-black">Partner Stores</h2>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black-icon" />
          <input 
            type="text" 
            placeholder="Search stores" 
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
              <th className="px-4 py-3 whitespace-nowrap">Store Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Category</th>
              <th className="px-4 py-3 whitespace-nowrap">Location</th>
              <th className="px-4 py-3 whitespace-nowrap">Redemption Limit</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap w-[146px]">Status Action</th>
              <th className="px-4 py-3 whitespace-nowrap w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white-stroke text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-paragraph">
                  No partner stores found.
                </td>
              </tr>
            ) : (
              filteredStores.map((store) => {
                const isSuspended = store.status === 'Suspended';
                
                return (
                  <tr key={store.id} className="hover:bg-white-bg/50 transition-colors bg-white h-[72px]">
                    <td className="px-4 py-4">
                      <span className="font-bold text-[#1F2937] text-sm">{store.name}</span>
                    </td>
                    <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                      {store.category}
                    </td>
                    <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                      {store.location}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-[13px] font-medium text-black-text">
                      {store.redemptionLimit ?? store.monthlyLimit ?? 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${store.status?.toUpperCase() === 'ACTIVE' ? 'bg-[#127C2F]' : 'bg-gray-400'}`}></div>
                        <span className={`font-bold text-[12px] ${store.status?.toUpperCase() === 'ACTIVE' ? 'text-[#127C2F]' : 'text-gray-500'}`}>
                          {store.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[146px]">
                      <button 
                        onClick={() => handleToggleStatus(store.id, store.status)}
                        className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all w-full max-w-[100px] block
                          ${store.status?.toUpperCase() === 'SUSPENDED'
                            ? 'bg-[#E9FFEA] text-[#127C2F] hover:bg-[#E9FFEA]/80' 
                            : 'bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FEE2E2]/80'
                          }`}
                      >
                        {store.status?.toUpperCase() === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(store)}
                          className="p-2 text-black-icon hover:text-primary transition-colors focus:outline-none bg-white-bg rounded-lg"
                          title="Edit Store"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(store.id)}
                          className="p-2 text-alert-error hover:bg-alert-errorLight transition-colors focus:outline-none bg-white-bg rounded-lg"
                          title="Delete Store"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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

      <AddPartnerStoreModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSaveStore}
        editStore={editingStore}
      />
      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Partner Store</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this partner store? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
