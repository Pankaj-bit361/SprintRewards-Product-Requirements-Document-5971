import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, THEMES } from '@/contexts/ThemeContext';
import { MdOutlineColorLens } from 'react-icons/md';
import { FiCheck } from 'react-icons/fi';

const FloatingThemeSwitcher = () => {
  const { currentTheme, switchTheme, themeNames, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleThemeChange = (themeName) => {
    switchTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div
      className="fixed top-6 right-0 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsOpen(false);
      }}
    >
      {/* Theme Button - Slides out on hover */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ x: isHovered ? -8 : 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-l-xl shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          border: `2px solid ${theme.primary}`,
          borderRight: 'none',
          boxShadow: `0 10px 30px ${theme.primary}30`
        }}
        title="Change Theme"
      >
        <MdOutlineColorLens className="w-5 h-5" style={{ color: theme.primary }} />
     
      </motion.button>

      {/* Theme Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-8 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: theme.surface,
                border: `2px solid ${theme.primary}`,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div
                className="p-4 border-b"
                style={{ 
                  borderColor: theme.border,
                  background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}10)`
                }}
              >
                <h3 className="font-bold text-lg" style={{ color: theme.text }}>
                  Choose Your Theme
                </h3>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  Select a color scheme
                </p>
              </div>

              {/* Theme Options */}
              <div className="p-3 space-y-2" style={{ flex: 1, maxHeight: '60vh', overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: '0.25rem' }}>
                {themeNames.map(({ key, name }) => {
                  const isActive = currentTheme === key;
                  const themeColor = (THEMES[key]?.primary) || '#7C3AED';

                  return (
                    <motion.button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
                      style={{
                        backgroundColor: isActive ? `${themeColor}20` : theme.surfaceLight,
                        border: `2px solid ${isActive ? themeColor : 'transparent'}`,
                        color: theme.text,
                      }}
                    >
                      {/* Background Gradient on Hover */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 opacity-10"
                          style={{
                            background: `linear-gradient(135deg, ${themeColor}, transparent)`
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.1 }}
                        />
                      )}

                      {/* Color Preview Circle */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                          style={{
                            backgroundColor: themeColor,
                            borderColor: theme.text,
                            boxShadow: `0 4px 12px ${themeColor}40`
                          }}
                        >
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <FiCheck className="w-4 h-4 text-white font-bold" />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Theme Name */}
                      <span className="flex-1 text-left font-semibold relative z-10">
                        {name}
                      </span>

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: themeColor }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div 
                className="p-3 border-t text-center"
                style={{ 
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceLight
                }}
              >
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  Theme changes apply instantly
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingThemeSwitcher;

