import React,{useState,useEffect} from 'react';
import {motion} from 'framer-motion';
import toast from 'react-hot-toast';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from '@/contexts/ThemeContext';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import * as FiIcons from 'react-icons/fi';
import * as HiIcons from 'react-icons/hi';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';

const {FiTrendingUp,FiGift,FiUsers,FiCheckCircle,FiAlertCircle,FiUnlock,FiActivity,FiTarget,FiCpu,FiDatabase,FiClock,FiPlay,FiRefreshCw,FiExternalLink}=FiIcons;
const {HiSparkles,HiLightningBolt,HiRocketLaunch}=HiIcons;
const {AiOutlineDashboard}=AiIcons;
const {BsGraphUp,BsShieldCheck}=BsIcons;

const Dashboard=()=> {
  const {user,isFounder,isCommunityOwner,communityPoints}=useAuth();
  const {theme}=useTheme();
  const [stats,setStats]=useState({
    currentSprint: null,
    recentTransactions: [],
    sprintStatistics: null,
    userSprintData: null
  });
  const [loading,setLoading]=useState(true);
  const [syncingSprintData,setSyncingSprintData]=useState(false);
  const [activeTab,setActiveTab]=useState('overview');
  const [animatedValues,setAnimatedValues]=useState({
    sprintPoints: 0,
    rewardPoints: 0,
    claimablePoints: 0,
    totalGiven: 0,
    totalReceived: 0,
  });

  useEffect(()=> {
    fetchDashboardData();
  },[]);

  useEffect(()=> {
    if (user) {
      const timer=setTimeout(()=> {
        setAnimatedValues({
          sprintPoints: user.sprintPoints || 0,
          rewardPoints: communityPoints?.rewardPoints || 0,
          claimablePoints: communityPoints?.claimablePoints || 0,
          totalGiven: communityPoints?.totalGiven || 0,
          totalReceived: communityPoints?.totalReceived || 0,
        });
      },500);
      return ()=> clearTimeout(timer);
    }
  },[user, communityPoints]);

  const fetchDashboardData=async ()=> {
    setLoading(true);
    try {
      const requests=[ 
        api.get('/sprints/current'),
        api.get('/transactions/history?limit=5') 
      ];

      // Add founder-specific requests
      if (isFounder) {
        requests.push(api.get('/sprints/statistics'));
      }

      const responses=await Promise.all(requests);
      const newStats={
        currentSprint: responses[0].data,
        recentTransactions: responses[1].data.transactions || [],
      };

      if (isFounder) {
        newStats.sprintStatistics=responses[2]?.data;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:',error);
      toast.error('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSprintData=async ()=> {
    if (!isFounder) return;
    setSyncingSprintData(true);
    try {
      await api.post('/sprints/sync');
      toast.success('Sprint data synced successfully!');
      fetchDashboardData();// Refresh data
    } catch (error) {
      toast.error('Failed to sync sprint data');
      console.error('Sprint sync error:',error);
    } finally {
      setSyncingSprintData(false);
    }
  };

  const handleUnlockPoints=async ()=> {
    try {
      const response=await api.post('/users/unlock-points');
      const data=response.data;
      toast.success(data.message);

      // Reload page to refresh community-specific points
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unlock points');
    }
  };

  const isWeekend=()=> {
    const day=new Date().getDay();
    return day===0 || day===6;
  };

  const containerVariants={
    hidden: {opacity: 0},
    visible: {opacity: 1,transition: {duration: 0.8,staggerChildren: 0.1}}
  };

  const cardVariants={
    hidden: {opacity: 0,y: 30},
    visible: {opacity: 1,y: 0,transition: {duration: 0.6,ease: "easeOut"}}
  };

  const AnimatedNumber=({value})=> {
    const [displayValue,setDisplayValue]=useState(0);

    useEffect(()=> {
      let animationFrameId;
      const start=displayValue;
      const end=value;
      const duration=1000;
      let startTime=null;

      const animate=(timestamp)=> {
        if (!startTime) startTime=timestamp;
        const progress=Math.min((timestamp - startTime) / duration,1);
        const currentValue=Math.floor(progress * (end - start) + start);
        setDisplayValue(currentValue);
        if (progress < 1) {
          animationFrameId=requestAnimationFrame(animate);
        }
      };

      animationFrameId=requestAnimationFrame(animate);
      return ()=> cancelAnimationFrame(animationFrameId);
    },[value,displayValue]);

    return <>{displayValue.toLocaleString()}</>;
  };

  if (loading) {
    return ( 
      <div className="min-h-screen flex items-center justify-center"> 
        <div className="relative"> 
          <div className="w-20 h-20 border-4 border-gray-800 rounded-full animate-pulse"></div> 
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin"></div> 
          <div className="absolute inset-0 flex items-center justify-center"> 
            <SafeIcon icon={FiCpu} className="w-8 h-8 text-white animate-pulse" /> 
          </div> 
        </div> 
      </div> 
    );
  } 

  // Get current sprint data for display 
  const currentSprintData=stats.userSprintData || user?.currentSprintData || {};
  const taskBreakdown=currentSprintData.taskBreakdown || {completed: 0,inProgress: 0,todo: 0,blocked: 0};

  return ( 
    <div className="min-h-screen text-white overflow-hidden relative"> 
      {/* Background Effects */} 
      <div className="fixed inset-0 pointer-events-none"> 
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: ` 
            linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px) 
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} /> 
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div> 
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div> 
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div> 
      </div> 

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-10" 
      > 
        {/* Header */}
        <motion.div className="mb-12" variants={cardVariants}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    <SafeIcon icon={AiOutlineDashboard} className="w-8 h-8" />
                  </div>
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.accent }}
                  ></div>
                </div>
                <div>
                  <h1 className="text-5xl font-bold mb-2" style={{ color: theme.text }}>Dashboard</h1>
                  <p className="text-lg" style={{ color: theme.textSecondary }}>
                    Welcome back,<span className="font-semibold" style={{ color: theme.text }}>{user?.name}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Founder sync button */}
              {isFounder && (
                <button
                  onClick={handleSyncSprintData}
                  disabled={syncingSprintData}
                  style={{
                    backgroundColor: theme.primaryLight,
                    color: theme.background,
                  }}
                  className="flex items-center px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.primaryLight;
                  }}
                >
                  <SafeIcon icon={FiRefreshCw} className={`w-4 h-4 mr-2 ${syncingSprintData ? 'animate-spin' : ''}`} />
                  {syncingSprintData ? 'Syncing...' : 'Sync Sprint Data'}
                </button>
              )}
              <div className="text-right">
                <div className="text-sm mb-1" style={{ color: theme.textSecondary }}>System Status</div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.success }}
                  ></div>
                  <span className="font-medium" style={{ color: theme.text }}>ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sprint Info Banner */}
        {stats.currentSprint && (
          <motion.div className="mb-8" variants={cardVariants}>
            <div
              className="border rounded-2xl p-6"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    <SafeIcon icon={FiExternalLink} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                      Current Sprint #{stats.currentSprint.sprintNumber}
                    </h3>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {new Date(stats.currentSprint.startDate).toLocaleDateString()} - {new Date(stats.currentSprint.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!isFounder && currentSprintData.totalTasks > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: theme.primary }}>
                      {currentSprintData.completedTasks}/{currentSprintData.totalTasks}
                    </div>
                    <div className="text-sm" style={{ color: theme.textSecondary }}>Tasks Completed</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" variants={containerVariants}>
          {[
  
            {
              icon: FiGift,
              label: 'Reward Points',
              value: isFounder || isCommunityOwner ? '∞' : animatedValues.rewardPoints,
              color: 'from-gray-100 to-gray-300',
              bgColor: 'bg-gray-800',
              borderColor: 'border-gray-800',
              subtitle: isFounder || isCommunityOwner ? 'Unlimited' : 'Available to give'
            },
            {
              icon: FiCheckCircle,
              label: 'Claimable Points',
              value: animatedValues.claimablePoints,
              color: 'from-green-100 to-green-300',
              bgColor: 'bg-green-900',
              borderColor: 'border-green-800',
              subtitle: 'Received from others'
            },
            {
              icon: FiTrendingUp,
              label: 'Points Given',
              value: animatedValues.totalGiven,
              color: 'from-gray-100 to-gray-300',
              bgColor: 'bg-gray-800',
              borderColor: 'border-gray-800',
              subtitle: 'Total sent'
            },
            {
              icon: FiUsers,
              label: 'Points Received',
              value: animatedValues.totalReceived,
              color: 'from-gray-100 to-gray-300',
              bgColor: 'bg-gray-800',
              borderColor: 'border-gray-800',
              subtitle: 'Total received'
            }
          ].map((stat,index)=> (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{scale: 1.05,y: -5}}
              className="relative group"
            >
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})`,
                }}
              ></div>
              <div
                className="relative border rounded-2xl p-6 transition-all duration-300"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: theme.primaryLight,
                      borderColor: theme.primary,
                      color: theme.background,
                    }}
                  >
                    <SafeIcon icon={stat.icon} className="w-6 h-6" />
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.surfaceLight }}
                  >
                    <SafeIcon icon={BsGraphUp} className="w-4 h-4" style={{ color: theme.primary }} />
                  </div>
                </div>
                <div className="text-sm mb-2" style={{ color: theme.textSecondary }}>{stat.label}</div>
                <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                  {typeof stat.value==='string' ? stat.value : <AnimatedNumber value={stat.value} />}
                  {stat.max && typeof stat.value==='number' && (
                    <span className="text-lg ml-2" style={{ color: theme.textSecondary }}>/ {stat.max}</span>
                  )}
                </div>
                {stat.subtitle && (
                  <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>{stat.subtitle}</div>
                )} 
                {stat.max && typeof stat.value==='number' && ( 
                  <div className="mt-3"> 
                    <div className="w-full bg-gray-800 rounded-full h-2"> 
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-1000" 
                        style={{width: `${(stat.value / stat.max) * 100}%`}} 
                      ></div> 
                    </div> 
                  </div> 
                )} 
              </div> 
            </motion.div> 
          ))} 
        </motion.div> 

        {/* Main Content Grid */} 
        <div className="flex flex-col lg:flex-row w-full gap-8"> 


          {/* Activity Feed */}
          <motion.div variants={cardVariants} className="flex-1">
            <div
              className="border rounded-3xl p-8 transition-all duration-300"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: theme.primary, color: theme.background }}
                >
                  <SafeIcon icon={FiActivity} className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: theme.text }}>Activity Feed</h2>
                  <p className="text-sm" style={{ color: theme.textSecondary }}>Recent transactions</p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar scroll-fade pr-1" style={{ overscrollBehavior: 'contain', scrollbarGutter: 'stable both-edges' }}>
                {stats?.recentTransactions?.length > 0 ? ( 
                  stats?.recentTransactions?.map((transaction,index)=> {
                    // Add null checks for transaction users
                    if (!transaction || !transaction.fromUserId || !transaction.toUserId) {
                      return null; // Skip this transaction if data is incomplete
                    }
                    
                    const isSent=transaction.fromUserId._id===user?.id;
                    return (
                      <motion.div
                        key={transaction._id || index}
                        initial={{opacity: 0,x: -20}}
                        animate={{opacity: 1,x: 0}}
                        transition={{delay: index * 0.1}}
                        className="p-4 rounded-xl border transition-all duration-300"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.surfaceLight,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: theme.surface }}
                            >
                              <SafeIcon
                                icon={isSent ? FiTrendingUp : FiGift}
                                className="w-5 h-5"
                                style={{ color: isSent ? theme.textSecondary : theme.primary }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: theme.text }}>
                                {isSent ? 'Sent to' : 'Received from'}
                                <span className="ml-1" style={{ color: theme.text }}>
                                  {isSent ? (transaction.toUserId?.name || 'Unknown User') : (transaction.fromUserId?.name || 'Unknown User')}
                                </span>
                              </div>
                              <div className="text-xs" style={{ color: theme.textSecondary }}>
                                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown date'}
                              </div>
                            </div>
                          </div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: isSent ? theme.textSecondary : theme.success }}
                          >
                            {isSent ? '-' : '+'}{transaction.points || 0}
                          </div>
                        </div> 
                      </motion.div> 
                    );
                  }).filter(Boolean) // Remove null entries
                ) : (
                  <div className="text-center py-12">
                    <SafeIcon icon={FiDatabase} className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: theme.textSecondary }} />
                    <p style={{ color: theme.textSecondary }}>No activity yet</p>
                  </div>
                )}
              </div> 
            </div> 
          </motion.div> 
        </div> 
      </motion.div> 

      <style jsx>{` 
        @keyframes grid-move {
          0% {transform: translate(0,0);} 
          100% {transform: translate(50px,50px);} 
        } 
        /* Minimal, auto-hide scrollbar (Firefox + WebKit) */
        .custom-scrollbar {
          scrollbar-width: none; /* Firefox: hide by default */
          scrollbar-color: var(--color-primary) transparent;
        }
        .custom-scrollbar:hover {
          scrollbar-width: thin; /* Firefox: show on hover */
        }
        /* WebKit/Chromium */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent; /* invisible until hover */
          border-radius: 8px;
          background-clip: padding-box;
          border: 2px solid transparent;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset, 0 2px 6px rgba(0,0,0,0.2);
          transition: background-color 0.2s ease, opacity 0.2s ease;
          opacity: 0;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: var(--color-primary);
          opacity: 0.85;
        }
        /* Subtle edge fade to hint scroll */
        .scroll-fade {
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent);
          mask-image: linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent);
        }
        .delay-1000 {
          animation-delay: 1s;
        } 
        .delay-2000 {
          animation-delay: 2s;
        } 
      `}</style> 
    </div> 
  );
};

export default Dashboard;