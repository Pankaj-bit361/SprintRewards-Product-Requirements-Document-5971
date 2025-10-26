import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, THEMES } from '@/contexts/ThemeContext';
import { FiDroplet, FiX } from 'react-icons/fi';
import { MdOutlineColorLens } from 'react-icons/md';

const ThemeSwitcher = () => {
  const { currentTheme, switchTheme, themeNames, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeName) => {
    switchTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Theme Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full flex items-center justify-left gap-1.5 px-3 py-2 rounded-lg transition-all duration-300"
        style={{
          backgroundColor: 'transparent',
          color: theme.textSecondary,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.surfaceLight;
          e.currentTarget.style.color = theme.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.textSecondary;
        }}
        title="Change Theme"
      >
        <MdOutlineColorLens className="w-5 h-5" />
        <span className="text-sm">Theme</span>
      </motion.button>

      {/* Theme Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full ml-2 bottom-0 w-56 rounded-xl shadow-2xl z-[100]"
            style={{
              backgroundColor: '#1a1a1a',
              border: `2px solid ${theme.primary}`,
              maxHeight: '70vh',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: theme.primary }}
            >
              <h3 className="font-semibold text-white text-lg">
                Choose Theme
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg transition-colors hover:bg-gray-700"
                style={{ color: '#9ca3af' }}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Options */}
            <div className="p-3 space-y-2" style={{ maxHeight: '60vh', overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: '0.25rem' }}>
              {themeNames.map(({ key, name }) => (
                <motion.button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor:
                      currentTheme === key ? theme.primary : '#2a2a2a',
                    color: '#ffffff',
                    border: currentTheme === key ? `2px solid ${theme.primary}` : '2px solid transparent',
                  }}
                >
                  {/* Color Preview */}
                  <div
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{
                      backgroundColor: (THEMES[key]?.primary) || '#7C3AED',
                      borderColor: '#ffffff',
                    }}
                  />
                  <span className="flex-1 text-left font-medium">
                    {name}
                  </span>
                  {currentTheme === key && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white flex-shrink-0"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;

