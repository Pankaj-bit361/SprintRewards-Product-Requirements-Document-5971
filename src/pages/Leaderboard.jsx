import React,{useState,useEffect} from 'react';
import {motion} from 'framer-motion';
import api from '@/api/axiosConfig.js';
import SafeIcon from '@/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
const {FiTrophy,FiGift,FiTrendingUp,FiUsers}=FiIcons;
const Leaderboard=()=> {
const [leaderboard,setLeaderboard]=useState({topGivers: [],topReceivers: []});
const [activeTab,setActiveTab]=useState('givers');
const [loading,setLoading]=useState(true);
useEffect(()=> {
fetchLeaderboard();
},[]);
const fetchLeaderboard=async ()=> {
setLoading(true);
try {
const response=await api.get('/users/leaderboard');
setLeaderboard(response.data);
} catch (error) {
console.error('Error fetching leaderboard:',error);
} finally {
setLoading(false);
}
};
const getRankIcon=(index)=> {
if (index===0) return '🥇';
if (index===1) return '🥈';
if (index===2) return '🥉';
return `${index + 1}`;
};
const getRankColor=(index)=> {
if (index===0) return 'text-black bg-white';
if (index===1) return 'text-black bg-gray-300';
if (index===2) return 'text-black bg-gray-500';
return 'text-gray-400 bg-gray-800';
};
if (loading) {
return (
<div className="min-h-screen flex items-center justify-center bg-black">
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
</div>
);
}
const currentData=activeTab==='givers' ? leaderboard.topGivers : leaderboard.topReceivers;
return (
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
{/* Header */}
<div className="text-center mb-8">
<motion.div
initial={{opacity: 0,y: 20}}
animate={{opacity: 1,y: 0}}
className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4"
>
<SafeIcon icon={FiTrophy} className="w-8 h-8 text-black" />
</motion.div>
<h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
<p className="text-gray-400">Celebrate top performers and team players</p>
</div>
{/* Tab Navigation */}
<div className="flex justify-center mb-8">
<div className="bg-gray-900 p-1 rounded-lg border border-gray-800">
<button
onClick={()=> setActiveTab('givers')}
className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
activeTab==='givers' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'
}`}
>
<SafeIcon icon={FiGift} className="w-4 h-4 inline mr-2" />
Top Givers
</button>
<button
onClick={()=> setActiveTab('receivers')}
className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
activeTab==='receivers' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'
}`}
>
<SafeIcon icon={FiTrendingUp} className="w-4 h-4 inline mr-2" />
Top Receivers
</button>
</div>
</div>
{/* Leaderboard */}
<motion.div
key={activeTab}
initial={{opacity: 0,x: 20}}
animate={{opacity: 1,x: 0}}
transition={{duration: 0.3}}
className="bg-gray-900 border border-gray-800 rounded-xl"
>
<div className="p-6 border-b border-gray-800">
<h2 className="text-lg font-semibold text-white flex items-center">
<SafeIcon icon={activeTab==='givers' ? FiGift : FiTrendingUp} className="w-5 h-5 mr-2 text-white" />
{activeTab==='givers' ? 'Most Generous Team Members' : 'Most Appreciated Team Members'}
</h2>
<p className="text-sm text-gray-400 mt-1">
{activeTab==='givers'
? 'Employees who share the most points with their teammates'
: 'Employees who receive the most recognition from peers'}
</p>
</div>
<div className="p-6">
{currentData.length > 0 ? (
<div className="space-y-4">
{currentData.map((user,index)=> (
<motion.div
key={user._id}
initial={{opacity: 0,y: 20}}
animate={{opacity: 1,y: 0}}
transition={{delay: index * 0.1}}
className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:bg-gray-800 ${
index < 3 ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-900'
}`}
>
<div className="flex items-center space-x-4">
{/* Rank */}
<div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(index)}`}>
{getRankIcon(index)}
</div>
{/* Avatar */}
<div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
<SafeIcon icon={FiUsers} className="w-6 h-6 text-white" />
</div>
{/* User Info */}
<div>
<h3 className="font-semibold text-white">{user.name}</h3>
<p className="text-sm text-gray-400">
{activeTab==='givers' ? 'Points Given' : 'Points Received'}
</p>
</div>
</div>
{/* Points */}
<div className="text-right">
<div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
index===0
? 'bg-white text-black'
: index===1
? 'bg-gray-300 text-black'
: index===2
? 'bg-gray-600 text-white'
: 'bg-gray-800 text-white'
}`}
>
<SafeIcon icon={FiGift} className="w-4 h-4 mr-1" />
{activeTab==='givers' ? user.totalGiven : user.totalReceived}
</div>
</div>
</motion.div>
))}
</div>
) : (
<div className="text-center py-12">
<SafeIcon icon={FiUsers} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
<p className="text-gray-500 text-lg">No data available yet</p>
<p className="text-gray-600 text-sm">Start sharing points to see the leaderboard!</p>
</div>
)}
</div>
</motion.div>
{/* Stats Summary */}
{currentData.length > 0 && (
<motion.div
initial={{opacity: 0,y: 20}}
animate={{opacity: 1,y: 0}}
transition={{delay: 0.5}}
className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
>
<div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
<div className="text-2xl font-bold text-white">
{currentData.reduce((sum,user)=> sum + (activeTab==='givers' ? user.totalGiven : user.totalReceived),0)}
</div>
<div className="text-sm text-gray-400">Total Points {activeTab==='givers' ? 'Given' : 'Received'}</div>
</div>
<div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
<div className="text-2xl font-bold text-white">{currentData.length}</div>
<div className="text-sm text-gray-400">Active Participants</div>
</div>
<div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
<div className="text-2xl font-bold text-white">
{currentData.length > 0
? Math.round(
currentData.reduce((sum,user)=> sum + (activeTab==='givers' ? user.totalGiven : user.totalReceived),0) /
currentData.length
)
: 0}
</div>
<div className="text-sm text-gray-400">Average Points</div>
</div>
</motion.div>
)}
</div>
);
};
export default Leaderboard;