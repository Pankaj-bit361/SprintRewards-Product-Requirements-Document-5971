import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../api/axiosConfig';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import FloatingThemeSwitcher from '../components/FloatingThemeSwitcher';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const { theme } = useTheme();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus the last input
      inputRefs.current[5]?.focus();
    } else {
      toast.error('Please paste a valid 6-digit OTP');
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    // Handle paste in individual input
    if (value.length > 1) {
      const pastedData = value.trim();
      if (/^\d{6}$/.test(pastedData)) {
        const newOtp = pastedData.split('');
        setOtp(newOtp);
        inputRefs.current[5]?.focus();
      }
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: otpCode });

      // Use loginWithToken to set authentication state without calling login API
      loginWithToken(response.data.token, response.data.user);

      toast.success(response.data.message || 'Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email });
      toast.success('OTP sent to your email');
      setTimeLeft(600);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: theme.background }}
    >
      {/* Floating Theme Switcher */}
      <FloatingThemeSwitcher />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div
          className="border rounded-3xl p-8 shadow-2xl"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: theme.primary, color: theme.background }}
            >
              <span className="text-3xl">📧</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>Verify OTP</h1>
            <p style={{ color: theme.textSecondary }}>Enter the 6-digit code sent to</p>
            <p className="font-semibold" style={{ color: theme.text }}>{email}</p>
          </motion.div>

          {/* OTP Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex gap-3 justify-center mb-6">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  whileFocus={{ scale: 1.05 }}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-all"
                  style={{
                    backgroundColor: theme.surfaceLight,
                    borderColor: theme.border,
                    color: theme.text,
                  }}
                  placeholder="0"
                  disabled={loading}
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Code expires in{' '}
                <span className="font-bold" style={{ color: timeLeft < 60 ? theme.error : theme.text }}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            </div>
          </motion.div>

          {/* Verify Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVerifyOtp}
            disabled={loading || otp.join('').length !== 6}
            className="w-full font-bold py-3 rounded-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              backgroundColor: theme.primary,
              color: theme.background,
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = theme.primaryLight;
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.primary;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                />
                Verifying...
              </span>
            ) : (
              'Verify OTP'
            )}
          </motion.button>

          {/* Resend OTP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className="font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ color: theme.primary }}
              >
                {canResend ? 'Resend OTP' : 'Resend in ' + formatTime(timeLeft)}
              </button>
            </p>
          </motion.div>

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-6 border-t border-gray-800 text-center"
          >
            <button
              onClick={() => navigate('/login')}
              className="text-gray-400 hover:text-white text-sm transition-all"
            >
              ← Back to Login
            </button>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-4"
        >
          <p className="text-gray-400 text-xs text-center">
            🔒 Your OTP is secure and will never be shared. Never share this code with anyone.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;

