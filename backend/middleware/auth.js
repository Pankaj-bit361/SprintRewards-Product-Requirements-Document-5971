import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const isFounder = (req, res, next) => {
  if (req.user.role !== 'founder') {
    return res.status(403).json({ message: 'Access denied. Founder role required.' });
  }
  next();
};

export const isFounderOrCommunityOwner = (req, res, next) => {
  const { communityId } = req.query || req.body || req.params;

  // Founders have access to everything
  if (req.user.role === 'founder') {
    return next();
  }

  // Community owners can only access their own community
  if (communityId) {
    const userCommunity = req.user.communities?.find(
      c => c.communityId.toString() === communityId.toString()
    );

    if (userCommunity && userCommunity.role === 'owner') {
      return next();
    }
  }

  return res.status(403).json({ message: 'Access denied. Founder or community owner role required.' });
};