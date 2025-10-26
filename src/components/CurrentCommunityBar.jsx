import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SafeIcon from '@/common/SafeIcon';
import { FiUsers, FiChevronRight } from 'react-icons/fi';

const CurrentCommunityBar = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!user?.currentCommunityId || !Array.isArray(user?.communities)) return null;

  const current = user.communities.find(
    (c) => (c.communityId?._id === user.currentCommunityId) || (c.communityId === user.currentCommunityId)
  );
  const name = current?.communityId?.name || 'Current Community';
  const image = current?.communityId?.image || '';

  return (
    <div
      className="mb-6 px-4 py-3 rounded-xl flex items-center justify-between border"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <div className="flex items-center space-x-3 min-w-0">
        {image ? (
          <img src={image} alt="Community" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.surfaceLight }}>
            <SafeIcon icon={FiUsers} className="w-4 h-4" style={{ color: theme.textSecondary }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs" style={{ color: theme.textSecondary }}>Current Community</p>
          <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{name}</p>
        </div>
      </div>
      <Link
        to="/switch-community"
        className="inline-flex items-center space-x-2 text-sm px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: theme.primaryLight, color: theme.text }}
      >
        <span>Switch</span>
        <FiChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default CurrentCommunityBar;

