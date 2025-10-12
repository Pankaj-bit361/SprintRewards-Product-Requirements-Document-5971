import React,{useState,useEffect} from 'react';
import {motion} from 'framer-motion';
import toast from 'react-hot-toast';
import {useAuth} from '@/contexts/AuthContext';
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
  const {user,updateUser,isFounder}=useAuth();
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
          rewardPoints: user.rewardPoints || 0,
          totalGiven: user.totalGiven || 0,
          totalReceived: user.totalReceived || 0,
        });
      },500);
      return ()=> clearTimeout(timer);
    }
  },[user]);

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
      } else if (user?.questHiveUserId) {
        requests.push(api.get('/sprints/my-points'));
      } 

      const responses=await Promise.all(requests);
      const newStats={
        currentSprint: responses[0].data,
        recentTransactions: responses[1].data.transactions || [],
      };

      if (isFounder) {
        newStats.sprintStatistics=responses[2]?.data;
      } else if (user?.questHiveUserId) {
        newStats.userSprintData=responses[2]?.data;
        // Update user context with latest sprint data 
        if (responses[2]?.data) {
          updateUser({
            sprintPoints: responses[2].data.sprintPoints,
            isEligible: responses[2].data.sprintPoints >=8
          });
        }
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
      updateUser({
        rewardPoints: data.rewardPoints,
        unlockedThisSprint: true,
      });
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
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl"> 
                    <SafeIcon icon={AiOutlineDashboard} className="w-8 h-8 text-black" /> 
                  </div> 
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-pulse"></div> 
                </div> 
                <div> 
                  <h1 className="text-5xl font-bold text-white mb-2">Dashboard</h1> 
                  <p className="text-gray-400 text-lg"> 
                    Welcome back,<span className="text-white font-semibold">{user?.name}</span> 
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
                  className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50" 
                > 
                  <SafeIcon icon={FiRefreshCw} className={`w-4 h-4 mr-2 ${syncingSprintData ? 'animate-spin' : ''}`} /> 
                  {syncingSprintData ? 'Syncing...' : 'Sync Sprint Data'} 
                </button> 
              )} 
              <div className="text-right"> 
                <div className="text-sm text-gray-500 mb-1">System Status</div> 
                <div className="flex items-center space-x-2"> 
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> 
                  <span className="text-white font-medium">ONLINE</span> 
                </div> 
              </div> 
            </div> 
          </div> 
        </motion.div> 

        {/* Sprint Info Banner */} 
        {stats.currentSprint && ( 
          <motion.div className="mb-8" variants={cardVariants}> 
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6"> 
              <div className="flex items-center justify-between"> 
                <div className="flex items-center space-x-4"> 
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center"> 
                    <SafeIcon icon={FiExternalLink} className="w-6 h-6 text-white" /> 
                  </div> 
                  <div> 
                    <h3 className="text-lg font-semibold text-white"> 
                      Current Sprint #{stats.currentSprint.sprintNumber} 
                    </h3> 
                    <p className="text-gray-400 text-sm"> 
                      {new Date(stats.currentSprint.startDate).toLocaleDateString()} - {new Date(stats.currentSprint.endDate).toLocaleDateString()} 
                    </p> 
                  </div> 
                </div> 
                {!isFounder && currentSprintData.totalTasks > 0 && ( 
                  <div className="text-right"> 
                    <div className="text-2xl font-bold text-white"> 
                      {currentSprintData.completedTasks}/{currentSprintData.totalTasks} 
                    </div> 
                    <div className="text-sm text-gray-400">Tasks Completed</div> 
                  </div> 
                )} 
              </div> 
            </div> 
          </motion.div> 
        )} 

        {/* Tab Navigation */} 
        <motion.div className="mb-8" variants={cardVariants}> 
          <div className="flex space-x-2 p-1 bg-gray-900 rounded-2xl border border-gray-800"> 
            {['overview','analytics','performance'].map((tab)=> ( 
              <button 
                key={tab} 
                onClick={()=> setActiveTab(tab)} 
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab===tab ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`} 
              > 
                {tab.charAt(0).toUpperCase() + tab.slice(1)} 
              </button> 
            ))} 
          </div> 
        </motion.div> 

        {/* Stats Cards */} 
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" variants={containerVariants}> 
          {[ 
            {
              icon: FiTarget,
              label: 'Sprint Points',
              value: animatedValues.sprintPoints,
              max: 12,
              color: 'from-gray-100 to-gray-300',
              bgColor: 'bg-gray-800',
              borderColor: 'border-gray-800',
              subtitle: isFounder ? 'System Average' : `${currentSprintData.completionRate || 0}% completion`
            },
            {
              icon: FiGift,
              label: 'Reward Points',
              value: isFounder ? '∞' : animatedValues.rewardPoints,
              color: 'from-gray-100 to-gray-300',
              bgColor: 'bg-gray-800',
              borderColor: 'border-gray-800',
              subtitle: isFounder ? 'Unlimited' : 'Available to send'
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
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity`}></div> 
              <div className={`relative bg-gray-900 border ${stat.borderColor} rounded-2xl p-6 hover:border-gray-700 transition-all duration-300`}> 
                <div className="flex items-center justify-between mb-4"> 
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center border ${stat.borderColor}`}> 
                    <SafeIcon icon={stat.icon} className="w-6 h-6 text-white" /> 
                  </div> 
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"> 
                    <SafeIcon icon={BsGraphUp} className="w-4 h-4 text-white" /> 
                  </div> 
                </div> 
                <div className="text-gray-400 text-sm mb-2">{stat.label}</div> 
                <div className="text-3xl font-bold text-white"> 
                  {typeof stat.value==='string' ? stat.value : <AnimatedNumber value={stat.value} />} 
                  {stat.max && typeof stat.value==='number' && ( 
                    <span className="text-gray-500 text-lg ml-2">/ {stat.max}</span> 
                  )} 
                </div> 
                {stat.subtitle && ( 
                  <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div> 
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> 
          {/* Mission Control / Sprint Progress */} 
          <motion.div variants={cardVariants} className="lg:col-span-2"> 
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-gray-700 transition-all duration-300"> 
              <div className="flex items-center justify-between mb-8"> 
                <div className="flex items-center space-x-3"> 
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"> 
                    <SafeIcon icon={HiRocketLaunch} className="w-6 h-6 text-black" /> 
                  </div> 
                  <div> 
                    <h2 className="text-2xl font-bold text-white"> 
                      {isFounder ? 'Sprint Overview' : 'Mission Control'} 
                    </h2> 
                    <p className="text-gray-400"> 
                      {isFounder ? 'System-wide sprint statistics' : 'Track your progress'} 
                    </p> 
                  </div> 
                </div> 
                <div className="text-right"> 
                  <div className="text-3xl font-bold text-white"> 
                    #{stats.currentSprint?.sprintNumber || 1} 
                  </div> 
                  <div className="text-sm text-gray-500">Current Sprint</div> 
                </div> 
              </div> 

              {!isFounder ? ( 
                <> 
                  {/* Employee Progress */} 
                  <div className="mb-8"> 
                    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden"> 
                      <div 
                        className="absolute inset-0 bg-white rounded-full" 
                        style={{width: `${(user?.sprintPoints / 12) * 100}%`}} 
                      > 
                        <div className="absolute inset-0 bg-black/20 animate-pulse"></div> 
                      </div> 
                      <div className="absolute inset-0 flex items-center justify-center"> 
                        <span className="text-xs font-bold text-black mix-blend-difference"> 
                          {Math.round((user?.sprintPoints / 12) * 100)}% 
                        </span> 
                      </div> 
                    </div> 
                    <div className="flex justify-between mt-2"> 
                      <span className="text-sm text-gray-400">Progress</span> 
                      <span className="text-sm text-white font-medium"> 
                        {user?.sprintPoints}/12 points 
                      </span> 
                    </div> 
                  </div> 

                  {/* Task Breakdown for Employees */} 
                  {currentSprintData.totalTasks > 0 && ( 
                    <div className="grid grid-cols-4 gap-4 mb-8"> 
                      <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                        <SafeIcon icon={FiCheckCircle} className="w-6 h-6 text-green-400 mx-auto mb-2" /> 
                        <div className="text-xl font-bold text-white">{taskBreakdown.completed}</div> 
                        <div className="text-xs text-gray-400">Completed</div> 
                      </div> 
                      <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                        <SafeIcon icon={FiPlay} className="w-6 h-6 text-blue-400 mx-auto mb-2" /> 
                        <div className="text-xl font-bold text-white">{taskBreakdown.inProgress}</div> 
                        <div className="text-xs text-gray-400">In Progress</div> 
                      </div> 
                      <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                        <SafeIcon icon={FiClock} className="w-6 h-6 text-gray-400 mx-auto mb-2" /> 
                        <div className="text-xl font-bold text-white">{taskBreakdown.todo}</div> 
                        <div className="text-xs text-gray-400">To Do</div> 
                      </div> 
                      <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                        <SafeIcon icon={FiAlertCircle} className="w-6 h-6 text-red-400 mx-auto mb-2" /> 
                        <div className="text-xl font-bold text-white">{taskBreakdown.blocked}</div> 
                        <div className="text-xs text-gray-400">Blocked</div> 
                      </div> 
                    </div> 
                  )} 

                  {/* Status Cards */} 
                  <div className="grid grid-cols-2 gap-6 mb-8"> 
                    <div className={`p-6 rounded-2xl border-2 ${
                      user?.isEligible ? 'border-gray-600 bg-gray-800' : 'border-gray-700 bg-gray-800'
                    }`}> 
                      <div className="flex items-center space-x-3 mb-3"> 
                        <SafeIcon icon={user?.isEligible ? BsShieldCheck : FiAlertCircle} className={`w-6 h-6 ${
                          user?.isEligible ? 'text-white' : 'text-gray-400'
                        }`} /> 
                        <span className={`font-semibold ${
                          user?.isEligible ? 'text-white' : 'text-gray-400'
                        }`}> 
                          {user?.isEligible ? 'Elite Status' : 'Training Mode'} 
                        </span> 
                      </div> 
                      <p className="text-sm text-gray-300"> 
                        {user?.isEligible ? 'You have qualified for weekend reward unlocking!' : 'Complete more tasks to achieve elite status.'} 
                      </p> 
                    </div> 
                    <div className="p-6 rounded-2xl border-2 border-gray-700 bg-gray-800"> 
                      <div className="flex items-center space-x-3 mb-3"> 
                        <SafeIcon icon={HiSparkles} className="w-6 h-6 text-white" /> 
                        <span className="font-semibold text-white">Completion Rate</span> 
                      </div> 
                      <div className="text-2xl font-bold text-white mb-1"> 
                        {currentSprintData.completionRate || 0}% 
                      </div> 
                      <div className="text-sm text-gray-400">Task Performance</div> 
                    </div> 
                  </div> 
                </> 
              ) : ( 
                /* Founder System Statistics */ 
                <div className="space-y-6"> 
                  {stats.sprintStatistics && ( 
                    <> 
                      <div className="grid grid-cols-3 gap-6"> 
                        <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                          <div className="text-2xl font-bold text-white"> 
                            {stats.sprintStatistics.totalEmployees} 
                          </div> 
                          <div className="text-sm text-gray-400">Total Employees</div> 
                        </div> 
                        <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                          <div className="text-2xl font-bold text-green-400"> 
                            {stats.sprintStatistics.eligibleEmployees} 
                          </div> 
                          <div className="text-sm text-gray-400">Eligible</div> 
                        </div> 
                        <div className="text-center p-4 bg-gray-800 rounded-lg"> 
                          <div className="text-2xl font-bold text-white"> 
                            {stats.sprintStatistics.eligibilityRate}% 
                          </div> 
                          <div className="text-sm text-gray-400">Eligibility Rate</div> 
                        </div> 
                      </div> 
                      <div className="grid grid-cols-2 gap-6"> 
                        <div className="p-4 bg-gray-800 rounded-lg"> 
                          <div className="text-lg font-semibold text-white mb-2">Task Progress</div> 
                          <div className="text-2xl font-bold text-white"> 
                            {stats.sprintStatistics.completedTasks}/{stats.sprintStatistics.totalTasks} 
                          </div> 
                          <div className="text-sm text-gray-400">Completed Tasks</div> 
                        </div> 
                        <div className="p-4 bg-gray-800 rounded-lg"> 
                          <div className="text-lg font-semibold text-white mb-2">Average Points</div> 
                          <div className="text-2xl font-bold text-white"> 
                            {stats.sprintStatistics.averageSprintPoints} 
                          </div> 
                          <div className="text-sm text-gray-400">Sprint Points</div> 
                        </div> 
                      </div> 
                    </> 
                  )} 
                </div> 
              )} 

              {/* Unlock Button or Status (Employee only) */} 
              {!isFounder && ( 
                <> 
                  {user?.isEligible && !user?.unlockedThisSprint && ( 
                    <motion.button 
                      whileHover={{scale: 1.02,boxShadow: "0 0 30px rgba(255,255,255,0.2)"}} 
                      whileTap={{scale: 0.98}} 
                      onClick={handleUnlockPoints} 
                      disabled={!isWeekend()} 
                      className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        isWeekend() ? 'bg-white text-black shadow-2xl hover:bg-gray-100' : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                      }`} 
                    > 
                      <div className="flex items-center justify-center space-x-3"> 
                        <SafeIcon icon={FiUnlock} className="w-6 h-6" /> 
                        <span> 
                          {isWeekend() ? 'Unlock 500 Points' : 'Weekend Activation Required'} 
                        </span> 
                        {isWeekend() && ( 
                          <SafeIcon icon={HiLightningBolt} className="w-6 h-6 animate-pulse" /> 
                        )} 
                      </div> 
                    </motion.button> 
                  )} 

                  {user?.unlockedThisSprint && ( 
                    <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6"> 
                      <div className="flex items-center space-x-3"> 
                        <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-white" /> 
                        <div> 
                          <div className="text-white font-bold text-lg">Points Unlocked!</div> 
                          <div className="text-gray-300 text-sm"> 
                            You have successfully claimed your rewards this sprint. 
                          </div> 
                        </div> 
                      </div> 
                    </div> 
                  )} 
                </> 
              )} 
            </div> 
          </motion.div> 

          {/* Activity Feed */} 
          <motion.div variants={cardVariants}> 
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 hover:border-gray-700 transition-all duration-300"> 
              <div className="flex items-center space-x-3 mb-6"> 
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg"> 
                  <SafeIcon icon={FiActivity} className="w-6 h-6 text-black" /> 
                </div> 
                <div> 
                  <h2 className="text-xl font-bold text-white">Activity Feed</h2> 
                  <p className="text-gray-400 text-sm">Recent transactions</p> 
                </div> 
              </div> 

              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar"> 
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
                        className={`p-4 rounded-xl border ${
                          isSent ? 'border-gray-700 bg-gray-800' : 'border-gray-700 bg-gray-800'
                        } hover:border-gray-600 transition-all duration-300`} 
                      > 
                        <div className="flex items-center justify-between"> 
                          <div className="flex items-center space-x-3"> 
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSent ? 'bg-gray-700' : 'bg-gray-700'
                            }`}> 
                              <SafeIcon icon={isSent ? FiTrendingUp : FiGift} className="w-5 h-5 text-white" /> 
                            </div> 
                            <div> 
                              <div className="text-sm font-medium text-white"> 
                                {isSent ? 'Sent to' : 'Received from'} 
                                <span className="ml-1 text-white"> 
                                  {isSent ? (transaction.toUserId?.name || 'Unknown User') : (transaction.fromUserId?.name || 'Unknown User')} 
                                </span> 
                              </div> 
                              <div className="text-xs text-gray-500"> 
                                {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown date'} 
                              </div> 
                            </div> 
                          </div> 
                          <div className={`text-lg font-bold ${
                            isSent ? 'text-gray-400' : 'text-white'
                          }`}> 
                            {isSent ? '-' : '+'}{transaction.points || 0} 
                          </div> 
                        </div> 
                      </motion.div> 
                    );
                  }).filter(Boolean) // Remove null entries
                ) : ( 
                  <div className="text-center py-12"> 
                    <SafeIcon icon={FiDatabase} className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" /> 
                    <p className="text-gray-500">No activity yet</p> 
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        } 
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        } 
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: white;
          border-radius: 3px;
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