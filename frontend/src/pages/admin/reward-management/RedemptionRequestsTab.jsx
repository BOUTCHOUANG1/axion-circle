import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ArrowRight, Eye, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export default function RedemptionRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/redemption-requests');
      setRequests(res.data?.data?.content || res.data?.data || []);
    } catch (error) {
      toast.error('Failed to load redemption requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);
  
  const [page, setPage] = useState(0);
  const totalPages = 1;

  const filteredRequests = requests.filter(req => {
    const userName = req.userName || req.user?.displayName || req.user?.firstName || req.user?.email || '';
    const storeName = req.storeName || req.reward?.partnerStore?.name || req.reward?.store?.name || req.reward?.store || '';
    return userName.toLowerCase().includes((searchTerm || '').toLowerCase()) || 
           storeName.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-[#FEF9C3] text-[#A16207]';
      case 'APPROVED':
      case 'COLLECTED':
        return 'bg-[#E9FFEA] text-[#127C2F]';
      case 'REJECTED':
        return 'bg-[#FEE2E2] text-[#EF4444]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/redemption-requests/${id}/status`, { status: newStatus });
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      toast.success(`Request status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm flex flex-col w-full h-full">
      <div className="p-4 sm:p-5 border-b border-white-stroke flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-heading font-bold text-lg text-black">Redemption Requests</h2>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black-icon" />
          <input 
            type="text" 
            placeholder="Search requests" 
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
              <th className="px-4 py-3 whitespace-nowrap">User Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Reward Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Category</th>
              <th className="px-4 py-3 whitespace-nowrap">Credits Spent</th>
              <th className="px-4 py-3 whitespace-nowrap">Claimed Date</th>
              <th className="px-4 py-3 whitespace-nowrap w-40">Status Action</th>
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
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-paragraph">
                  No redemption requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-white-bg/50 transition-colors bg-white h-[72px]">
                  <td className="px-4 py-4">
                    <span className="font-bold text-[#1F2937] text-sm">{req.userName || req.user?.displayName || req.user?.firstName || req.user?.email || 'Unknown User'}</span>
                  </td>
                  <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                    {req.rewardName || 'Unknown Reward'}
                  </td>
                  <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                    {req.rewardCategory || req.category || 'N/A'}
                  </td>
                  <td className="px-4 py-4 font-bold text-sm text-primary">
                    {((req.creditsSpent ?? req.credits ?? req.reward?.creditsRequired) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-[#4B5563] font-medium text-sm">
                    {new Date(req.date || req.claimedAt || req.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="relative inline-block">
                      <select 
                        value={req.status?.toUpperCase()} 
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className={`px-3 py-1 pr-8 text-[12px] font-bold rounded-full appearance-none cursor-pointer border border-transparent hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${getStatusColor(req.status)}`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="COLLECTED">COLLECTED</option>
                      </select>
                      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <ChevronDown className={`w-3 h-3 ${getStatusColor(req.status).split(' ')[1]}`} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      className="p-2 text-black-icon hover:text-primary transition-colors focus:outline-none bg-white-bg rounded-lg mx-auto"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
    </div>
  );
}
