import React,{useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useAuth} from '@/contexts/AuthContext';
import SafeIcon from '@/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
const {FiUser,FiLogOut,FiMenu,FiX,FiTrendingUp,FiUsers,FiSettings,FiList}=FiIcons;
const Navbar=()=> {
const {user,logout,isFounder}=useAuth();
const location=useLocation();
const navigate=useNavigate();
const [isMenuOpen,setIsMenuOpen]=useState(false);
const handleLogout=()=> {
logout();
navigate('/');
};
const navItems=[ {path: '/',label: 'Dashboard',icon: FiTrendingUp},{path: '/leaderboard',label: 'Leaderboard',icon: FiUsers},{path: '/transactions',label: 'Transactions',icon: FiTrendingUp},...(isFounder ? [{path: '/admin',label: 'Admin Panel',icon: FiSettings}] : []),];
return (
 <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-900">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo */}
 <Link to="/" className="flex items-center space-x-2">
 <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
 <span className="text-black font-bold text-sm">BR</span>
 </div>
 <span className="font-bold text-xl text-white">Bravo Rewards</span>
 </Link>
 {/* Desktop Navigation */}
 <div className="hidden md:flex items-center space-x-8">
 {navItems.map((item)=> (
 <Link key={item.path} to={item.path} className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${location.pathname===item.path ? 'text-white bg-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`} >
 <SafeIcon icon={item.icon} className="w-4 h-4" />
 <span>{item.label}</span>
 </Link>
 ))}
 </div>
 {/* User Menu */}
 <div className="hidden md:flex items-center space-x-4">
 <div className="flex items-center space-x-2">
 <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
 <SafeIcon icon={FiUser} className="w-4 h-4 text-white" />
 </div>
 <div className="text-sm">
 <p className="font-medium text-white">{user?.name}</p>
 <p className="text-gray-500 capitalize">{user?.role}</p>
 </div>
 </div>
 <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors">
 <SafeIcon icon={FiLogOut} className="w-5 h-5" />
 </button>
 </div>
 {/* Mobile menu button */}
 <div className="md:hidden">
 <button onClick={()=> setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:text-white">
 <SafeIcon icon={isMenuOpen ? FiX : FiMenu} className="w-6 h-6" />
 </button>
 </div>
 </div>
 </div>
 {/* Mobile menu */}
 {isMenuOpen && (
 <motion.div initial={{opacity: 0,y: -10}} animate={{opacity: 1,y: 0}} exit={{opacity: 0,y: -10}} className="md:hidden bg-black border-t border-gray-900" >
 <div className="px-2 pt-2 pb-3 space-y-1">
 {navItems.map((item)=> (
 <Link key={item.path} to={item.path} onClick={()=> setIsMenuOpen(false)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all ${location.pathname===item.path ? 'text-white bg-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`} >
 <SafeIcon icon={item.icon} className="w-5 h-5" />
 <span>{item.label}</span>
 </Link>
 ))}
 <div className="border-t border-gray-900 pt-2">
 <div className="flex items-center px-3 py-2">
 <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
 <SafeIcon icon={FiUser} className="w-4 h-4 text-white" />
 </div>
 <div className="ml-3">
 <p className="font-medium text-white">{user?.name}</p>
 <p className="text-gray-500 capitalize">{user?.role}</p>
 </div>
 </div>
 <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-400 hover:text-white hover:bg-gray-900 rounded-md" >
 <SafeIcon icon={FiLogOut} className="w-5 h-5" />
 <span>Logout</span>
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </nav>
 );
};

export default Navbar;