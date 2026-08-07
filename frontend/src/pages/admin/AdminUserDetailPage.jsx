import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Mail, Phone, MapPin, Search, Settings, Bell, ChevronDown, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import SEO from '../../components/SEO';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile Details');

  // Tabs Definition
  const tabs = ['Profile Details', 'Reports', 'Rewards', 'Activity'];

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setHasError(false);
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data?.data || res.data);
    } catch (err) {
      console.error('Failed to fetch user', err);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const isSuspending = !user.suspended;
    
    try {
      await api.patch(`/admin/users/${user.id}/suspend`, { suspended: isSuspending });
      toast.success(`User ${isSuspending ? 'suspended' : 'activated'} successfully`);
      fetchUser();
    } catch (err) {
      console.error(`Failed to update status`, err);
      toast.error(`Failed to update user status. Please try again.`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  if (hasError || !user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="w-12 h-12 text-[#DB0404] mb-4" />
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <button onClick={() => navigate('/admin/users')} className="text-primary hover:underline">
            Back to Users List
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isSuspended = user.suspended;
  const displayName = user.displayName || user.firstName || 'User';

  return (
    <AdminLayout>
      <SEO title={`${displayName} | Admin`} description="User Profile Details" />

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="text-black font-semibold hover:text-primary transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4 text-paragraph" />
          <Link to="/admin/users" className="text-black font-semibold hover:text-primary transition-colors">User Profile</Link>
          <ChevronRight className="w-4 h-4 text-paragraph" />
          <span className="text-primary font-semibold">{activeTab}</span>
        </div>
        <p className="text-sm text-paragraph mt(-2)">Profile of a Cleanreport user</p>

        {/* User Header Card */}
        <div className="bg-white border border-white-stroke rounded-2xl p-6 flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} 
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
              />
              <div className="absolute bottom-0 right-0 bg-[#127C2F] text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-black">{user.firstName} {user.lastName || ''}</h1>
                {isSuspended && (
                  <span className="px-2.5 py-0.5 bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-full flex items-center gap-1.5 border border-[#EF4444]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-paragraph">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 opacity-70" />
                  <span>{user.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 opacity-70" />
                  <span>{user.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-paragraph">
                <MapPin className="w-4 h-4 opacity-70" />
                <span>{user.address || 'Address not available'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-bold border transition-colors w-full sm:w-auto
                ${isSuspended ? 'border-white-stroke text-black hover:bg-white-bg' : 'border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]'}
              `}
              onClick={handleToggleStatus}
            >
              {isSuspended ? 'Delete User' : 'Deactivate User'}
            </button>
            <button 
              className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors w-full sm:w-auto
                ${!isSuspended ? 'bg-[#127C2F] opacity-50 cursor-not-allowed' : 'bg-[#127C2F] hover:bg-[#127C2F]/90 shadow-sm'}
              `}
              onClick={isSuspended ? handleToggleStatus : undefined}
              disabled={!isSuspended}
            >
              Reactivate User
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard title="Reports submitted" value={user.totalReports || 0} />
          <StatCard title="Resolved reports" value={user.resolvedReports || 0} />
          <StatCard title="Credit balance" value={user.creditBalance || 0} />
          <StatCard title="Credits redeemed" value={user.creditsRedeemed || 0} />
        </div>

        {/* Tabs navigation */}
        <div className="flex bg-white rounded-xl border border-white-stroke p-1.5 w-max">
          {tabs.map((tab) => {
            const isReportsTab = tab === 'Reports';
            const displayLabel = isReportsTab ? `Reports (${user.totalReports || 4})` : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-black shadow-sm'
                    : 'text-paragraph hover:text-black hover:bg-white-bg/50'
                }`}
              >
                {displayLabel}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === 'Profile Details' && <ProfileDetailsTab user={user} />}
          {activeTab === 'Reports' && <ReportsTab userId={user.id} />}
          {activeTab === 'Rewards' && <RewardsTab userId={user.id} />}
          {activeTab === 'Activity' && <ActivityTab userId={user.id} />}
        </div>
      </div>
    </AdminLayout>
  );
}

// Subcomponents

const StatCard = ({ title, value }) => (
  <div className="bg-white border border-white-stroke rounded-2xl p-5 flex flex-col gap-2">
    <h3 className="text-sm font-bold text-paragraph">{title}</h3>
    <p className="text-3xl font-heading font-bold text-black">{value.toLocaleString()}</p>
  </div>
);

const ProfileDetailsTab = ({ user }) => (
  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-8 gap-y-6">
    <div className="text-sm font-bold text-black mt-3 hidden md:block">First Name</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">First Name</div>
      <input type="text" readOnly value={user.firstName || ''} className="w-full sm:w-[500px] px-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none" />
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Middle Name</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Middle Name</div>
      <input type="text" readOnly value={""} className="w-full sm:w-[500px] px-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none" />
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Last Name</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Last Name</div>
      <input type="text" readOnly value={user.lastName || ''} className="w-full sm:w-[500px] px-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none" />
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Phone Number</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Phone Number</div>
      <div className="relative w-full sm:w-[500px]">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-paragraph font-bold">
          <span className="text-lg">🇺🇸</span>
        </div>
        <input type="text" readOnly value={user.phone || '+1 908 765 4321'} className="w-full pl-12 pr-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none" />
      </div>
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Gender</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Gender</div>
      <div className="relative w-full sm:w-[500px]">
        <select disabled value={user.gender || 'Female'} className="w-full px-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none appearance-none disabled:opacity-100">
          <option>Female</option>
          <option>Male</option>
          <option>Other</option>
        </select>
        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-paragraph" />
      </div>
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Email Address</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Email Address</div>
      <div className="relative w-full sm:w-[500px]">
        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black-icon" />
        <input type="text" readOnly value={user.email || ''} className="w-full pl-10 pr-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none" />
      </div>
    </div>

    <div className="text-sm font-bold text-black mt-3 hidden md:block">Home Address</div>
    <div>
      <div className="md:hidden text-sm font-bold text-black mb-2">Home Address</div>
      <textarea readOnly value={user.address || 'No 7 Clean Road, off Refinary Junction, Lagos State'} className="w-full sm:w-[500px] h-[100px] px-4 py-3 bg-white border border-white-stroke rounded-xl text-black text-sm outline-none resize-none" />
      <div className="text-[12px] text-paragraph mt-2">400 characters left</div>
    </div>
  </div>
);

const ReportsTab = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${userId}/reports?page=${page}&size=10`);
        const pageData = res.data?.data || res.data;
        setReports(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load reports', err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast.error(`Failed to load reports: ${errMsg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [userId, page]);

  const getStatusColors = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PROGRESS')) return { text: 'text-[#9333EA]', dot: 'bg-[#9333EA]' };
    if (s.includes('PENDING')) return { text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' };
    if (s.includes('APPROV') || s.includes('RESOLV')) return { text: 'text-[#127C2F]', dot: 'bg-[#127C2F]' };
    if (s.includes('REJECT')) return { text: 'text-[#EF4444]', dot: 'bg-[#EF4444]' };
    return { text: 'text-[#3B82F6]', dot: 'bg-[#3B82F6]' };
  };

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-white-stroke">
        <h3 className="font-heading font-bold text-lg">Reports Submitted</h3>
        <Link to="/admin/reports" className="text-primary font-semibold text-sm hover:underline">View in Report</Link>
      </div>
      
      <div className="overflow-x-auto min-h-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex justify-center items-center h-full py-10 text-paragraph text-sm">
            No reports found for this user.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-white-stroke text-xs font-semibold text-paragraph h-[44px]">
                <th className="px-5 py-3 whitespace-nowrap">Reports ID</th>
                <th className="px-5 py-3 whitespace-nowrap">Category</th>
                <th className="px-5 py-3 whitespace-nowrap">Location</th>
                <th className="px-5 py-3 whitespace-nowrap">Date</th>
                <th className="px-5 py-3 whitespace-nowrap flex items-center gap-1">Status <ChevronDown className="w-3 h-3 opacity-50" /></th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white-stroke text-sm">
              {reports.map((report) => {
                const colors = getStatusColors(report.status);
                const date = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A';
                return (
                  <tr key={report.id} className="hover:bg-white-bg/50 transition-colors h-[64px]">
                    <td className="px-5 py-3 font-bold text-black">{report.reportCode || report.id.substring(0, 8)}</td>
                    <td className="px-5 py-3 text-paragraph">{report.category}</td>
                    <td className="px-5 py-3 text-paragraph">{report.address || report.areaName || 'Unknown Location'}</td>
                    <td className="px-5 py-3 text-paragraph">{date}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                        <span className={`text-[12px] font-bold ${colors.text}`}>{report.status || 'UNKNOWN'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Link to={`/admin/reports/${report.id}`} className="p-1.5 text-black-icon hover:text-primary transition-colors focus:outline-none inline-block">
                        <Eye className="w-4 h-4 opacity-70 hover:opacity-100" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-5 border-t border-white-stroke flex items-center justify-between">
        <button 
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <div className="text-sm text-paragraph font-bold">
          Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
        </div>
        <button 
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const RewardsTab = ({ userId }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${userId}/rewards?page=${page}&size=10`);
        const pageData = res.data?.data || res.data;
        setRewards(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load rewards', err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast.error(`Failed to load rewards: ${errMsg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [userId, page]);

  const getStatusColors = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return { text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' };
    if (s === 'REJECTED') return { text: 'text-[#EF4444]', dot: 'bg-[#EF4444]' };
    return { text: 'text-[#127C2F]', dot: 'bg-[#127C2F]' }; // APPROVED
  };

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-white-stroke">
        <h3 className="font-heading font-bold text-lg">Reward History</h3>
      </div>
      
      <div className="overflow-x-auto min-h-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex justify-center items-center h-full py-10 text-paragraph text-sm">
            No rewards history found for this user.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-white-stroke text-xs font-semibold text-paragraph h-[44px]">
                <th className="px-5 py-3 w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-white-stroke text-primary" />
                </th>
                <th className="px-5 py-3 whitespace-nowrap">Rewards</th>
                <th className="px-5 py-3 whitespace-nowrap">Category</th>
                <th className="px-5 py-3 whitespace-nowrap">Credits</th>
                <th className="px-5 py-3 whitespace-nowrap">Date</th>
                <th className="px-5 py-3 whitespace-nowrap flex items-center gap-1">Status <ChevronDown className="w-3 h-3 opacity-50" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white-stroke text-sm">
              {rewards.map((reward) => {
                const colors = getStatusColors(reward.status);
                const date = reward.claimedAt ? new Date(reward.claimedAt).toLocaleDateString() : 'N/A';
                return (
                  <tr key={reward.id} className="hover:bg-white-bg/50 transition-colors h-[64px]">
                    <td className="px-5 py-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-white-stroke text-primary" />
                    </td>
                    <td className="px-5 py-3 font-bold text-black">{reward.rewardName || 'Unknown Reward'}</td>
                    <td className="px-5 py-3 text-paragraph">{reward.rewardCategory || 'N/A'}</td>
                    <td className="px-5 py-3 text-paragraph">{reward.creditsSpent?.toLocaleString() || 0}</td>
                    <td className="px-5 py-3 text-paragraph">{date}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                        <span className={`text-[12px] font-bold ${colors.text}`}>{reward.status || 'UNKNOWN'}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-5 border-t border-white-stroke flex items-center justify-between">
        <button 
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <div className="text-sm text-paragraph font-bold">
          Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
        </div>
        <button 
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ActivityTab = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${userId}/activity?page=${page}&size=10`);
        const pageData = res.data?.data || res.data;
        setActivities(pageData.content || []);
        setTotalPages(pageData.totalPages || 1);
      } catch (err) {
        console.error('Failed to load activities', err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast.error(`Failed to load activities: ${errMsg}`);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userId, page]);

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-white-stroke">
        <h3 className="font-heading font-bold text-lg">Activity Timeline</h3>
      </div>
      
      <div className="p-6 flex flex-col gap-4 bg-white-bg/20 min-h-[200px]">
        {loading ? (
          <div className="flex justify-center items-center h-full py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex justify-center items-center h-full py-10 text-paragraph text-sm">
            No recent activity found.
          </div>
        ) : (
          activities.map((activity, index) => {
            const date = activity.timestamp || activity.createdAt ? new Date(activity.timestamp || activity.createdAt).toLocaleString() : 'N/A';
            return (
              <div key={activity.id || index} className="bg-white border border-white-stroke rounded-xl p-5 flex flex-col gap-1.5 shadow-xs">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-heading font-bold text-black">{activity.type || activity.title || activity.action || 'Activity'}</h4>
                  {activity.creditsChange ? (
                    <span className={`text-sm font-bold ${activity.creditsChange > 0 ? 'text-[#127C2F]' : 'text-[#EF4444]'}`}>
                      {activity.creditsChange > 0 ? '+' : ''}{activity.creditsChange} pts
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-paragraph font-medium">{activity.description || activity.desc}</p>
                <p className="text-[13px] text-paragraph mt-1">{date}</p>
              </div>
            );
          })
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button 
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Newer
            </button>
            <div className="text-sm text-paragraph font-bold">
              Page {page + 1} of {totalPages}
            </div>
            <button 
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-2 px-4 py-2 border border-white-stroke rounded-xl text-sm font-semibold text-black hover:bg-white-bg transition-colors bg-white disabled:opacity-50"
            >
              Older <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
