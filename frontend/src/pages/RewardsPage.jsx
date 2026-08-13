import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gift, Coins, Info, Trophy, ChevronLeft, ChevronRight, Copy, CheckCircle, Ticket, ArrowRight, X, Flame, Zap, Shield, Hexagon, Circle, User, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/Footer';
import api from '../services/api';
import SEO from '../components/SEO';
import RewardDetailModal from '../components/RewardDetailModal';

// Custom Relative Time Formatter
function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format date short
function formatDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LEVELS = [
  { name: 'Observer', icon: <Circle className="w-4 h-4" />, threshold: 0, color: 'text-gray-500', bg: 'bg-gray-100', text: 'text-gray-600' },
  { name: 'Reporter', icon: <Shield className="w-4 h-4" />, threshold: 50, color: 'text-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  { name: 'Guardian', icon: <Hexagon className="w-4 h-4" />, threshold: 200, color: 'text-green-500', bg: 'bg-green-100', text: 'text-green-600' },
  { name: 'Champion', icon: <Trophy className="w-4 h-4" />, threshold: 500, color: 'text-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' },
  { name: 'Legend', icon: <Crown className="w-4 h-4" />, threshold: 1000, color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-700' }
];

const getLevelInfo = (score) => {
  return [...LEVELS].reverse().find(l => score >= l.threshold) || LEVELS[0];
};


const PodiumCup = ({ rank }) => {
  const isFirst = rank === 1;
  const colors = {
    1: { fill: '#FBBF24', stroke: '#D97706', text: '#FFFFFF' }, // Gold
    2: { fill: '#E5E7EB', stroke: '#9CA3AF', text: '#4B5563' }, // Silver
    3: { fill: '#F97316', stroke: '#C2410C', text: '#FFFFFF' }  // Bronze
  };
  const c = colors[rank];
  const sizeClass = isFirst ? 'w-24 h-24' : 'w-16 h-16';
  
  return (
    <div className={`relative flex items-center justify-center ${sizeClass} mb-3`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Handles */}
        <path d="M 25 30 C 0 30, 0 60, 30 55" fill="none" stroke={c.fill} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 75 30 C 100 30, 100 60, 70 55" fill="none" stroke={c.fill} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Base and Stem */}
        <path d="M 45 70 L 45 85 L 25 85 L 25 95 L 75 95 L 75 85 L 55 85 L 55 70 Z" fill={c.fill} />
        {/* Bowl */}
        <path d="M 15 15 L 85 15 L 80 40 C 75 70, 25 70, 20 40 Z" fill={c.fill} />
        {/* Top lip */}
        <rect x="10" y="10" width="80" height="8" rx="4" fill={c.stroke} />
        {/* Detail lines on bowl */}
        <path d="M 30 25 L 30 50" fill="none" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <path d="M 70 25 L 70 50" fill="none" stroke={c.stroke} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        {/* Rank Number in center */}
        <text x="50" y="45" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="28" fill={c.text} textAnchor="middle" dominantBaseline="middle" className="drop-shadow-sm">
          {rank}
        </text>
      </svg>
    </div>
  );
};

export default function RewardsPage() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState({ balance: 0, lifetimeCredits: 0, level: 'OBSERVER', streakCount: 0, nextLevelAt: 50, multiplier: 1.0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  // Get current user ID for correct "You" matching
  let currentUserId = null;
  let currentUserDisplayName = localStorage.getItem('user_name');
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      currentUserId = parsed.id || parsed._id;
    }
  } catch (e) {}

  const checkIsMe = (user) => {
    if (currentUserId && user.userId) {
      return String(user.userId) === String(currentUserId);
    }
    
    // Fallback: If userId is missing, match by name. 
    // If there are duplicate names, break the tie using their actual credit balance!
    if (user.displayName === currentUserDisplayName) {
      const userScore = user.creditScore ?? user.lifetimeCredits ?? 0;
      const localScore = balance.balance ?? 0;
      
      if (userScore === localScore) return true;
      
      // If only one user has this name on the board, it's safe to assume it's them
      const nameMatches = leaderboard.filter(u => u.displayName === currentUserDisplayName);
      if (nameMatches.length === 1) return true;
    }
    return false;
  };

  // Carousels
  const tipsScrollRef = useRef(null);
  const rewardsScrollRef = useRef(null);
  
  const scrollContainer = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      const reqs = [api.get('/rewards')];
      
      if (token) {
        reqs.push(api.get('/credits/balance').catch(() => ({ data: { data: null } })));
        reqs.push(api.get('/leaderboard').catch(() => ({ data: { data: [] } })));
        reqs.push(api.get('/rewards/my-claims').catch(() => ({ data: { data: [] } })));
        reqs.push(api.get('/credits/history?size=10').catch(() => ({ data: { data: { content: [] } } })));
      }

      const results = await Promise.all(reqs);
      const rewardsRes = results[0];
      const rewardsData = rewardsRes?.data?.data || [];
      setRewards(rewardsData);
      
      if (token) {
        const balRes = results[1]?.data?.data;
        if (balRes) setBalance(balRes);
        
        const rawLeaderboard = results[2]?.data?.data || [];
        // The API returns 'creditBalance', but the UI expects 'creditScore'
        setLeaderboard(rawLeaderboard.map(u => ({
          ...u,
          creditScore: u.creditBalance ?? u.creditScore ?? 0
        })));
        
        const claimsData = results[3]?.data?.data || [];
        setMyClaims(claimsData);
        
        setTransactions(results[4]?.data?.data?.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch rewards data:', error);
      toast.error('Failed to load rewards data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClaim = async (reward) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in to claim rewards.');
      navigate('/login');
      return;
    }

    try {
      setIsClaiming(true);
      if (balance.balance < reward.creditsRequired) {
        toast.error("You don't have enough Eco-Points for this reward.");
        return;
      }
      await api.post(`/rewards/${reward.id}/claim`);
      toast.success(`Successfully claimed ${reward.name}!`);
      fetchData(); // Refresh all data
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to claim reward.';
      toast.error(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Code copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy code.');
    });
  };

  // Helper derived values
  const currentLevelInfo = LEVELS.find(l => l.name.toUpperCase() === balance.level?.toUpperCase()) || LEVELS[0];
  const nextLevelInfo = LEVELS[LEVELS.findIndex(l => l.name === currentLevelInfo.name) + 1] || null;
  const progressPercent = balance.nextLevelAt > 0 
    ? Math.min(100, (balance.lifetimeCredits / balance.nextLevelAt) * 100)
    : 100;
  
  const creditsToNext = balance.nextLevelAt > 0 ? balance.nextLevelAt - balance.lifetimeCredits : 0;

  // Render
  return (
    <div className="min-h-screen bg-gray-50 font-body flex flex-col">
      <SEO title="Rewards" />
      <AppNavbar activeTab="rewards" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-12">
        
        {/* Top Header & Breadcrumb */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2 font-medium">
              <Link to="/dashboard" className="hover:text-primary hover:underline">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-primary">Rewards</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Credits & Rewards</h1>
            <p className="text-gray-500 text-sm">Earn credits for keeping your neighbourhood clean.</p>
          </div>
          <button 
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center justify-center gap-2 bg-[#127C2F] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#0e6325] transition-colors text-sm w-full md:w-auto shadow-sm"
          >
            <Info className="w-4 h-4" /> See How it Works
          </button>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 1. Credit Balance & Leaderboard Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="flex flex-col gap-10">
                {/* Credit Balance Card */}
                <div className="bg-[#0A1F13] rounded-[2rem] p-6 sm:p-8 text-white flex flex-col relative overflow-hidden shadow-lg h-fit">
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-gray-200 text-sm font-medium">Credit Balance</p>
                    <div className="bg-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm text-gray-800">
                      <span className="text-[#127C2F]">{currentLevelInfo.icon}</span>
                      <span className="text-[#127C2F] capitalize">{currentLevelInfo.name}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <h2 className="text-6xl sm:text-7xl font-heading font-bold tracking-tight">{balance.balance}</h2>
                    <span className="text-xl text-gray-200 font-medium">Credits</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-10">
                    <div className="bg-white text-orange-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" fill="currentColor" /> {balance.streakCount || 0} days streak
                    </div>
                    {balance.multiplier >= 1.0 && (
                      <div className="bg-white text-[#127C2F] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" fill="currentColor" /> {balance.multiplier}x earning boost
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-bold text-base sm:text-lg">{currentLevelInfo.name} Level</span>
                      {nextLevelInfo ? (
                        <span className="text-xs text-gray-300 flex items-center gap-1 font-medium">
                          {creditsToNext} credits to <span className="text-blue-400 flex items-center">{nextLevelInfo.icon}</span> {nextLevelInfo.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 font-medium">Max Level Reached</span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-black/40 h-2.5 rounded-full mb-4 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#127C2F]" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    {/* Level Legend */}
                    <div className="flex justify-between items-center text-[10px] sm:text-xs font-semibold">
                      {LEVELS.map(level => {
                        const isActive = level.name === currentLevelInfo.name;
                        return (
                          <div key={level.name} className={`flex items-center gap-1 ${isActive ? 'text-white' : 'text-gray-400 opacity-60'}`}>
                            <span className={isActive ? '' : level.color}>{level.icon}</span>
                            <span className="hidden sm:inline">{level.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Level Up Faster Carousel */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-gray-900">Level Up Faster</h3>
                    <p className="text-xs text-gray-500 mt-0.5">See tips here to get more points.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => scrollContainer(tipsScrollRef, -1)} className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => scrollContainer(tipsScrollRef, 1)} className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                
                <div 
                  ref={tipsScrollRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="w-full sm:w-[calc(50%-0.375rem)] snap-start rounded-xl p-4 bg-blue-50 border-l-4 border-blue-400 flex-shrink-0 relative overflow-hidden shadow-sm">
                    <h4 className="font-bold text-xs text-blue-900 mb-1.5">Levels Multiply Everything</h4>
                    <p className="text-[10px] text-blue-800/80 leading-relaxed font-medium">Each level adds an earning boost. Guardian earns 1.2x, Champion 1.5x, Legend 2x on every credit you make.</p>
                  </div>
                  <div className="w-full sm:w-[calc(50%-0.375rem)] snap-start rounded-xl p-4 bg-green-50 border-l-4 border-[#127C2F] flex-shrink-0 relative overflow-hidden shadow-sm">
                    <h4 className="font-bold text-xs text-green-900 mb-1.5">Report Daily to Keep Streaks</h4>
                    <p className="text-[10px] text-green-800/80 leading-relaxed font-medium">A submitted report each day keeps your flame alive. Streaks of 7+ days pay a bonus of 15 credits.</p>
                  </div>
                  {/* Third Tip */}
                  <div className="w-full sm:w-[calc(50%-0.375rem)] snap-start rounded-xl p-4 bg-orange-50 border-l-4 border-orange-400 flex-shrink-0 relative overflow-hidden shadow-sm">
                    <h4 className="font-bold text-xs text-orange-900 mb-1.5">Resolution Bonus</h4>
                    <p className="text-[10px] text-orange-800/80 leading-relaxed font-medium">When your reported issue gets resolved, you earn a massive bonus based on the severity of the issue.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Community Leaderboard Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-gray-800">
                    <Trophy className="w-5 h-5 text-gray-700" /> Community Leaderboard
                  </h3>
                </div>

                {/* Podium */}
                <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 px-2 pt-10">
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <div className="flex flex-col items-center flex-1">
                      <PodiumCup rank={2} />
                      <div className="text-center mb-2">
                        <p className="font-bold text-sm text-gray-900 truncate leading-tight">
                          {checkIsMe(leaderboard[1]) ? 'You' : leaderboard[1].displayName.split(' ')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-[#127C2F]">2nd Position</p>
                      </div>
                      <div className="bg-[#0f172a] text-white w-full rounded-[1.25rem] py-3 px-1 text-center shadow-lg flex flex-col justify-center items-center h-20">
                        <p className="font-bold text-lg leading-none mb-1">{leaderboard[1].creditScore ?? leaderboard[1].lifetimeCredits ?? 0}</p>
                        <p className="text-[10px] text-gray-400 leading-none">Credit Score</p>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <div className="flex flex-col items-center flex-1 z-10 -mt-6">
                      <PodiumCup rank={1} />
                      <div className="text-center mb-2">
                        <p className="font-bold text-base text-gray-900 truncate leading-tight">
                          {checkIsMe(leaderboard[0]) ? 'You' : leaderboard[0].displayName.split(' ')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-[#127C2F]">1st Position</p>
                      </div>
                      <div className="bg-yellow-500 text-white w-full rounded-[1.25rem] py-4 px-1 text-center shadow-lg transform scale-105 flex flex-col justify-center items-center h-24 relative">
                        <div className="absolute -top-3 right-[-10px] bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm">
                          TOP CONTRIBUTOR
                        </div>
                        <p className="font-bold text-xl sm:text-2xl leading-none mb-1">{leaderboard[0].creditScore ?? leaderboard[0].lifetimeCredits ?? 0}</p>
                        <p className="text-[10px] text-yellow-100 leading-none">Credit Score</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <div className="flex flex-col items-center flex-1">
                      <PodiumCup rank={3} />
                      <div className="text-center mb-2">
                        <p className="font-bold text-sm text-gray-900 truncate leading-tight">
                          {checkIsMe(leaderboard[2]) ? 'You' : leaderboard[2].displayName.split(' ')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-[#127C2F]">3rd Position</p>
                      </div>
                      <div className="bg-[#f97316] text-white w-full rounded-[1.25rem] py-3 px-1 text-center shadow-md flex flex-col justify-center items-center h-20">
                        <p className="font-bold text-lg leading-none mb-1">{leaderboard[2].creditScore ?? leaderboard[2].lifetimeCredits ?? 0}</p>
                        <p className="text-[10px] text-orange-100 leading-none">Credit Score</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* List View */}
                <div className="flex-1 space-y-2 pr-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent" style={{ maxHeight: '205px' }}>
                  {leaderboard.slice(3).map((user, idx) => {
                    const rank = idx + 4;
                    const isMe = checkIsMe(user);
                    const userScore = user.creditScore ?? user.lifetimeCredits ?? 0;

                    return (
                      <div key={user.userId || idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isMe ? 'border-[#127C2F]/40 bg-green-50/40' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isMe ? 'bg-[#127C2F]/10 text-[#127C2F]' : 'bg-gray-100 text-gray-500'}`}>
                            #{rank}
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${isMe ? 'text-[#127C2F]' : 'text-gray-900'}`}>
                              {isMe ? 'You' : user.displayName}
                            </p>
                            <p className={`text-[10px] font-medium ${isMe ? 'text-[#127C2F]/70' : 'text-gray-400'}`}>
                              {(() => {
                                const top3Score = leaderboard[2] ? (leaderboard[2].creditScore ?? leaderboard[2].lifetimeCredits ?? 0) : 0;
                                const diff = top3Score - userScore;
                                return diff > 0 ? `${diff} credits to break into the top 3` : 'Keep climbing!';
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold text-base ${isMe ? 'text-[#127C2F]' : 'text-gray-900'}`}>
                          {userScore}
                        </div>
                      </div>
                    );
                  })}
                  
                  {leaderboard.length <= 3 && (
                    <p className="text-center text-gray-500 text-sm py-4">No more users on the leaderboard yet.</p>
                  )}
                </div>

                {!leaderboard.some(u => checkIsMe(u)) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-[#127C2F]/30 bg-green-50/30 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 bg-[#127C2F]/10 text-[#127C2F]">
                            -
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#127C2F]">
                              You
                            </p>
                            <p className="text-[10px] font-medium text-[#127C2F]/70">
                              {(() => {
                                const top3Score = leaderboard[2] ? (leaderboard[2].creditScore ?? leaderboard[2].lifetimeCredits ?? 0) : 0;
                                const userScore = balance.balance ?? 0;
                                const diff = top3Score - userScore;
                                return diff > 0 ? `${diff} credits to break into the top 3` : 'Keep climbing!';
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="font-bold text-base text-[#127C2F]">
                          {balance.balance ?? 0}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Available Rewards Carousel */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-heading text-xl font-bold text-gray-900">Available Rewards</h3>
                  <p className="text-sm text-gray-500">Credits only no currency, no physical pickup. Everything is delivered as a digital code.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => scrollContainer(rewardsScrollRef, -1)} className="w-8 h-8 flex items-center justify-center border border-[#127C2F] text-[#127C2F] rounded-full hover:bg-green-50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => scrollContainer(rewardsScrollRef, 1)} className="w-8 h-8 flex items-center justify-center bg-[#127C2F] text-white rounded-full hover:bg-[#0e6325] transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>

              <div 
                ref={rewardsScrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {rewards.length === 0 ? (
                   <div className="w-full text-center py-12 bg-white border border-gray-200 rounded-2xl">
                     <p className="text-gray-500">No rewards currently available.</p>
                   </div>
                ) : (
                  rewards.map(reward => (
                    <div key={reward.id} className="min-w-[280px] sm:min-w-[320px] bg-white rounded-2xl border border-gray-200 overflow-hidden snap-start flex-shrink-0 shadow-sm flex flex-col">
                      <div className="relative h-40 bg-gray-100">
                        {reward.imageUrl ? (
                          <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Gift className="w-12 h-12" />
                          </div>
                        )}
                        {/* Tag */}
                        <div className="absolute top-3 left-3 bg-gray-900/80 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                          {reward.category || 'Reward'}
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1 bg-white">
                        <h4 className="font-bold text-base text-gray-900 mb-1">{reward.name}</h4>
                        <p className="text-xs text-gray-500 mb-4 flex-1 line-clamp-2">{reward.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto mb-4">
                          <span className="font-bold text-[#127C2F] text-sm">{reward.creditsRequired} credits</span>
                          <span className="text-xs text-gray-500 font-medium">{reward.quantityAvailable} left</span>
                        </div>
                        
                        <button 
                          onClick={() => setSelectedReward(reward)}
                          className={`w-full py-2.5 rounded-lg font-bold text-sm border transition-colors ${
                            reward.quantityAvailable > 0
                              ? 'border-[#127C2F] text-[#127C2F] hover:bg-green-50 bg-white'
                              : 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          {reward.quantityAvailable <= 0 
                            ? 'Out of Stock' 
                            : balance.balance >= reward.creditsRequired 
                              ? 'Claim Reward' 
                              : 'View Details'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 4. Bottom Two Columns: Claims & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* My Latest Claims */}
              <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">My Latest Claims</h3>
                
                {myClaims.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">No claims yet. Start redeeming your credits!</p>
                ) : (
                  <div className="space-y-6">
                    {myClaims.slice(0, 5).map(claim => {
                      const isPending = claim.status === 'PENDING';
                      const isApproved = claim.status === 'APPROVED';
                      const isCollected = claim.status === 'COLLECTED';
                      
                      return (
                        <div key={claim.id} className="flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-900">{claim.reward?.name || 'Unknown Reward'}</h4>
                              <p className="text-xs text-gray-500">Claimed {timeAgo(claim.claimedAt)}</p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                              isCollected ? 'bg-[#E9FFEA] text-[#127C2F]' :
                              isApproved ? 'bg-blue-50 text-blue-600' :
                              'bg-yellow-50 text-yellow-600'
                            }`}>
                              {claim.status} {isCollected && <CheckCircle className="w-3 h-3" />}
                            </span>
                          </div>
                          
                          {/* Progress Bar (3 stages) */}
                          <div className="mt-4">
                            <div className="flex gap-1.5 h-1.5 mb-2">
                              {/* Segment 1 */}
                              <div className={`flex-1 rounded-full ${isCollected ? 'bg-[#127C2F]' : isApproved ? 'bg-blue-500' : 'bg-yellow-400'}`}></div>
                              {/* Segment 2 */}
                              <div className={`flex-1 rounded-full ${isCollected ? 'bg-[#127C2F]' : isApproved ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                              {/* Segment 3 */}
                              <div className={`flex-1 rounded-full ${isCollected ? 'bg-[#127C2F]' : 'bg-gray-200'}`}></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                              <span className={isCollected ? 'text-[#127C2F]' : isApproved ? 'text-blue-500' : 'text-yellow-500'}>Pending</span>
                              <span className={isCollected ? 'text-[#127C2F]' : isApproved ? 'text-blue-500' : ''}>Approved</span>
                              <span className={isCollected ? 'text-[#127C2F]' : ''}>Collected</span>
                            </div>
                          </div>

                          {/* Action Area based on status */}
                          {claim.redemptionCode && (
                            <div className="mt-2 bg-[#F0FDF4] border border-green-100 rounded-lg p-3 flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-[#166534]">{claim.redemptionCode}</span>
                              <button 
                                onClick={() => copyToClipboard(claim.redemptionCode)}
                                className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-700"
                              >
                                <Copy className="w-3.5 h-3.5" /> copy
                              </button>
                            </div>
                          )}
                          
                          {!claim.redemptionCode && isApproved && (
                            <button className="mt-2 w-full py-2.5 bg-[#127C2F] text-white rounded-lg text-sm font-bold hover:bg-[#0e6325] transition-colors">
                              Mark as Claimed
                            </button>
                          )}
                          
                          {isPending && (
                            <p className="text-[10px] text-gray-500 mt-2 italic font-medium">Waiting for partner approval — this usually takes a few moments.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Recent Transactions */}
              <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8">
                <h3 className="font-heading text-lg font-bold text-gray-900 mb-6">Recent Transactions</h3>
                
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-10">No recent transactions.</p>
                ) : (
                  <div className="space-y-0">
                    {transactions.map(tx => {
                      // Attempt to parse "Action: Description" from reason if formatted that way
                      let action = 'Activity';
                      let desc = tx.reason;
                      if (tx.reason?.includes(':')) {
                        const parts = tx.reason.split(':');
                        action = parts[0];
                        desc = parts.slice(1).join(':').trim();
                      }

                      return (
                        <div key={tx.id} className="flex justify-between items-start py-4 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{action}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-medium text-gray-500">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-heading font-bold mb-4">How it Works</h3>
            <div className="space-y-4 text-gray-600 text-sm">
              <p><strong>1. Report Issues:</strong> Submit environmental reports to earn +2 credits. Earn bonus credits when your report is verified (+5) and resolved (+10).</p>
              <p><strong>2. Keep a Streak:</strong> Submitting a report daily keeps your streak alive! A 7-day streak grants a +3 bonus, and a 30-day streak grants a +15 bonus.</p>
              <p><strong>3. Level Up:</strong> Your lifetime credits determine your Rank (Observer → Legend). Higher ranks grant permanent earning multipliers up to 2x on every credit you earn!</p>
              <p><strong>4. Claim Rewards:</strong> Exchange your spendable credits for digital rewards (e.g. Data, Airtime, Store Discounts) directly from this page.</p>
            </div>
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="mt-8 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Reward Detail Modal */}
      {selectedReward && (
        <RewardDetailModal 
          reward={selectedReward}
          onClose={() => setSelectedReward(null)}
          onClaimSuccess={() => {
            setSelectedReward(null);
            fetchData(); // Refresh the balance and claims list
          }}
        />
      )}
    </div>
  );
}
