import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import SEO from '../../../components/SEO';
import { RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import CreditRulesTab from './CreditRulesTab';
import PartnerStoresTab from './PartnerStoresTab';
import RedemptionRequestsTab from './RedemptionRequestsTab';
import RewardCatalogTab from './RewardCatalogTab';

export default function AdminRewardManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'credit-rules';
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [isCreditRuleModalOpen, setIsCreditRuleModalOpen] = useState(false);
  const [isPartnerStoreModalOpen, setIsPartnerStoreModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  const tabs = [
    { id: 'credit-rules', label: 'Credit Rules' },
    { id: 'partner-stores', label: 'Partner Stores' },
    { id: 'redemption-requests', label: 'Redemption Requests' },
    { id: 'reward-catalog', label: 'Reward Catalog' }
  ];

  // Refresh handler (can be passed down to tabs if they have their own fetch logic)
  const handleRefresh = () => {
    setLoading(true);
    // Simulate a global refresh or trigger child refresh
    setTimeout(() => {
      setLoading(false);
      toast.success('Data refreshed successfully');
    }, 800);
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <AdminLayout>
      <SEO title="Reward Management | Admin" description="CleanReport Admin Reward Management" />
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xl sm:text-[22px] font-heading font-bold mb-1">
              <span className="text-paragraph">Dashboard</span>
              <span className="text-paragraph">›</span>
              <span className="text-paragraph">Reward Management</span>
              <span className="text-paragraph">›</span>
              <span className="text-primary">{tabs.find(t => t.id === currentTab)?.label}</span>
            </div>
            <p className="text-sm text-paragraph font-medium">
              Manage CleanCredits rules, partner stores, redemptions and the reward catalog.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">

            {currentTab === 'partner-stores' && (
              <button 
                onClick={() => setIsPartnerStoreModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm"
              >
                Add Store
              </button>
            )}
            {currentTab === 'reward-catalog' && (
              <button 
                onClick={() => setIsRewardModalOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm"
              >
                New Reward
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-white-stroke text-black font-semibold rounded-xl hover:bg-white-bg transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Page
            </button>
          </div>
        </div>

        {/* Tab Navigation (Pill layout) */}
        <div className="flex">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-white-stroke rounded-xl shadow-sm overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 text-[13px] font-bold whitespace-nowrap rounded-lg transition-all ${
                    isActive 
                      ? 'bg-[#F9FAFB] text-black shadow-sm' 
                      : 'text-paragraph hover:text-black hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area - Tabs render their own cards now */}
        <div className="w-full">
          {currentTab === 'credit-rules' && <CreditRulesTab 
            isModalOpen={isCreditRuleModalOpen} 
            setIsModalOpen={setIsCreditRuleModalOpen} 
          />}
          {currentTab === 'partner-stores' && <PartnerStoresTab 
            isModalOpen={isPartnerStoreModalOpen} 
            setIsModalOpen={setIsPartnerStoreModalOpen} 
          />}
          {currentTab === 'redemption-requests' && <RedemptionRequestsTab />}
          {currentTab === 'reward-catalog' && <RewardCatalogTab 
            isModalOpen={isRewardModalOpen} 
            setIsModalOpen={setIsRewardModalOpen} 
          />}
        </div>
        
      </div>
    </AdminLayout>
  );
}
