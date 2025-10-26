import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import FloatingThemeSwitcher from '../components/FloatingThemeSwitcher';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import api from '../api/axiosConfig';

const { FiMail, FiLogIn, FiUser } = FiIcons;

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = React.useRef([]);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    if (otpSent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, timeLeft]);

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { email });
      setOtpSent(true);
      setTimeLeft(600);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpCode });
      // Use loginWithToken to update AuthContext state
      loginWithToken(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { email });
      setTimeLeft(600);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundColor: theme.background }}>
      {/* Floating Theme Switcher */}
      <FloatingThemeSwitcher />

      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '600px',
            height: '600px',
            background: `radial-gradient(circle, ${theme.primary}25, transparent 70%)`,
            top: '-15%',
            left: '-10%'
          }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: '500px',
            height: '500px',
            background: `radial-gradient(circle, ${theme.accent}20, transparent 70%)`,
            bottom: '-10%',
            right: '-10%'
          }}
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative h-full grid lg:grid-cols-2">
        <motion.div
          className="hidden lg:flex flex-col justify-center px-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.surface}95 0%, ${theme.primary}12 40%, ${theme.accent}08 100%)`,
            backdropFilter: 'blur(20px)'
          }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large Primary Orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '550px',
                height: '550px',
                background: `radial-gradient(circle, ${theme.primary}40, ${theme.primary}20 40%, transparent 70%)`,
                top: '-10%',
                left: '-15%',
                filter: 'blur(80px)',
                opacity: 0.8
              }}
              animate={{
                x: [0, 60, 0],
                y: [0, 100, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Large Accent Orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '480px',
                height: '480px',
                background: `radial-gradient(circle, ${theme.accent}35, ${theme.accent}18 40%, transparent 70%)`,
                bottom: '-12%',
                right: '-12%',
                filter: 'blur(70px)',
                opacity: 0.7
              }}
              animate={{
                x: [0, -70, 0],
                y: [0, -60, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Medium Primary Light Orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '400px',
                height: '400px',
                background: `radial-gradient(circle, ${theme.primaryLight || theme.primary}30, transparent 65%)`,
                top: '40%',
                right: '0%',
                filter: 'blur(60px)',
                opacity: 0.6
              }}
              animate={{
                x: [0, 50, 0],
                y: [0, -70, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Small Accent Orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${theme.accent}25, transparent 60%)`,
                top: '15%',
                right: '15%',
                filter: 'blur(50px)',
                opacity: 0.5
              }}
              animate={{
                x: [0, -40, 0],
                y: [0, 50, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Tiny Highlight Orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${theme.primary}20, transparent 55%)`,
                top: '60%',
                left: '30%',
                filter: 'blur(40px)',
                opacity: 0.4
              }}
              animate={{
                x: [0, 30, 0],
                y: [0, -40, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Mesh Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(at 20% 30%, ${theme.primary}15 0px, transparent 50%),
                radial-gradient(at 80% 70%, ${theme.accent}12 0px, transparent 50%),
                radial-gradient(at 50% 50%, ${theme.primaryLight || theme.primary}08 0px, transparent 50%)
              `,
              opacity: 0.6
            }}
          />

          {/* Animated Dot Pattern */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, ${theme.primary}30 1.5px, transparent 1.5px)`,
              backgroundSize: '50px 50px',
              backgroundPosition: '0 0',
              opacity: 0.1
            }}
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px']
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Diagonal Lines Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                ${theme.primary}40 0px,
                ${theme.primary}40 1px,
                transparent 1px,
                transparent 60px
              )`
            }}
          />

          {/* Enhanced Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}05 0%, transparent 30%, ${theme.accent}05 70%, transparent 100%)`,
              opacity: 0.8
            }}
          />

          {/* Vignette Effect - Enhanced */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 20%, ${theme.background}20 70%, ${theme.background}50 100%)`,
              opacity: 0.6
            }}
          />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(110deg, transparent 30%, ${theme.primary}08 50%, transparent 70%)`,
              opacity: 0.5
            }}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
          
          <div className="relative z-10 space-y-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

              <h1 className="text-6xl font-black mb-4 leading-tight" style={{ color: theme.text }}>Bravo</h1>
              <p className="text-xl font-semibold" style={{ color: theme.textSecondary }}>Next-Gen Employee Recognition Platform</p>
            </motion.div>

            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-5xl font-black leading-tight">
                <motion.span style={{ color: theme.text }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>Motivate.{' '}</motion.span>
                <motion.span style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>Recognize.{' '}</motion.span>
                <motion.span style={{ color: theme.text }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>Reward.</motion.span>
              </h2>
              <p className="text-xl leading-relaxed font-medium" style={{ color: theme.textSecondary }}>Transform team engagement through sprint-based achievements, AI-powered validation, and peer recognition that drives real results.</p>
            </motion.div>

            <motion.div className="space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              {[
                { icon: '🎯', title: 'Sprint-Based Rewards', desc: 'Earn points through performance and achievements', color: theme.primary },
                { icon: '📊', title: 'Real-Time Tracking', desc: 'Monitor progress and milestones as they happen', color: theme.accent },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group flex items-start gap-5 p-6 rounded-2xl cursor-pointer"
                  style={{ backgroundColor: `${theme.surface}70`, backdropFilter: 'blur(20px)', border: `1px solid ${theme.border}30` }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.15, type: "spring", stiffness: 100 }}
                  whileHover={{ x: 15, backgroundColor: theme.surface, borderColor: feature.color, boxShadow: `0 20px 50px ${feature.color}30` }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${feature.color}25, ${feature.color}15)`, border: `2px solid ${feature.color}30` }}
                    whileHover={{ scale: 1.1, rotate: 5, boxShadow: `0 10px 30px ${feature.color}40` }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-black text-xl mb-2 group-hover:translate-x-1 transition-transform" style={{ color: theme.text }}>{feature.title}</h3>
                    <p className="text-base leading-relaxed" style={{ color: theme.textSecondary }}>{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

           
          </div>
        </motion.div>

        <motion.div className="flex items-center justify-center px-6 lg:px-12" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div className="w-full max-w-md">
            <motion.div
              className="relative p-8 border-2 rounded-3xl overflow-hidden"
              style={{ backgroundColor: `${theme.surface}95`, borderColor: `${theme.primary}40`, backdropFilter: 'blur(20px)', boxShadow: `0 20px 60px ${theme.primary}20` }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent}, ${theme.primary})` }} />

              <div className="text-center mb-6">
                <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, boxShadow: `0 8px 20px ${theme.primary}30` }} whileHover={{ scale: 1.05 }}>
                  <SafeIcon icon={FiUser} className="w-8 h-8" style={{ color: theme.background }} />
                </motion.div>
                <h3 className="text-2xl font-black mb-2" style={{ color: theme.text }}>Welcome Back</h3>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Sign in to access your rewards dashboard</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: `${theme.error}20`, color: theme.error, border: `1px solid ${theme.error}40` }}>
                  {error}
                </motion.div>
              )}

              {otpSent ? (
                <motion.div className="space-y-5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <motion.div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-2" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, boxShadow: `0 10px 30px ${theme.primary}40` }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <span className="text-3xl">📧</span>
                  </motion.div>
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-lg mb-1" style={{ color: theme.text }}>Enter OTP</h4>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>We sent a code to {email}</p>
                  </div>
                  <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-black border-2 rounded-xl focus:outline-none transition-all"
                        style={{ backgroundColor: digit ? theme.surfaceLight : theme.surface, borderColor: digit ? theme.primary : theme.border, color: theme.text, boxShadow: digit ? `0 0 20px ${theme.primary}30` : 'none' }}
                        whileFocus={{ scale: 1.1 }}
                        placeholder="•"
                      />
                    ))}
                  </div>
                  <div className="text-center mb-4">
                    <div className="inline-block px-4 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: timeLeft > 60 ? `${theme.success}20` : `${theme.warning}20`, color: timeLeft > 60 ? theme.success : theme.warning }}>
                      ⏱️ {formatTime(timeLeft)}
                    </div>
                  </div>
                  <motion.button onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6} className="w-full py-4 font-black text-lg rounded-2xl focus:outline-none disabled:opacity-50 transition-all" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`, color: theme.background, boxShadow: `0 10px 30px ${theme.primary}30` }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {loading ? 'Verifying...' : '✓ Verify OTP'}
                  </motion.button>
                  <div className="flex justify-between items-center text-sm">
                    <motion.button onClick={() => setOtpSent(false)} className="font-medium" style={{ color: theme.textSecondary }} whileHover={{ color: theme.primary }}>← Back to Login</motion.button>
                    {canResend && (
                      <motion.button onClick={handleResendOtp} disabled={loading} className="font-bold" style={{ color: theme.primary }} whileHover={{ scale: 1.05 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Resend OTP</motion.button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <>
                  <form onSubmit={handleOtpRequest} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <SafeIcon icon={FiMail} className="h-5 w-5" style={{ color: theme.textSecondary }} />
                        </div>
                        <motion.input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all font-medium" style={{ backgroundColor: theme.surfaceLight, borderColor: theme.border, color: theme.text }} onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 4px ${theme.primary}20`; }} onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = 'none'; }} whileFocus={{ scale: 1.01 }} placeholder="you@company.com" required />
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-4 font-black text-lg rounded-2xl focus:outline-none disabled:opacity-50 transition-all relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryLight})`, color: theme.background, boxShadow: `0 10px 30px ${theme.primary}30` }}>
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 relative z-10">
                            <motion.div className="w-5 h-5 border-3 border-t-transparent rounded-full" style={{ borderColor: theme.background, borderWidth: '3px' }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                            Sending OTP...
                          </motion.div>
                        ) : (
                          <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 relative z-10">
                            <SafeIcon icon={FiLogIn} className="w-5 h-5" />
                            📧 Send OTP
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;