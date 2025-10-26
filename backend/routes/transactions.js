import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Send points to another user
router.post('/send', auth, async (req, res) => {
  try {
    const { toUserId, points, message, communityId } = req.body;
    const fromUserId = req.user._id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: 'Cannot send points to yourself' });
    }

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const sender = await User.findById(fromUserId);
    const recipient = await User.findById(toUserId);

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const pointsNum = Number(points);

    // Find sender's community-specific balance
    const senderCommunity = sender.communities.find(
      c => c.communityId.toString() === communityId.toString()
    );

    if (!senderCommunity) {
      return res.status(403).json({ message: 'You are not a member of this community' });
    }

    const senderBalance = senderCommunity.rewardPoints || 0;
    const isCommunityOwner = senderCommunity.role === 'owner';

    // Bypass balance check for founder or community owner
    if (sender.role !== 'founder' && !isCommunityOwner && senderBalance < pointsNum) {
      return res.status(400).json({
        message: `Insufficient reward points in this community. You have ${senderBalance} points.`
      });
    }

    // Check if transaction needs approval (founders and owners don't need approval)
    const needsApproval = sender.role !== 'founder' && !isCommunityOwner && pointsNum > 100;

    const transaction = new Transaction({
      fromUserId,
      toUserId,
      points: pointsNum,
      message,
      type: 'transfer',
      status: needsApproval ? 'pending' : 'approved',
      communityId,
    });
    await transaction.save();

    if (!needsApproval) {
      // Update sender's community-specific points ONLY (skip for founders and owners)
      if (sender.role !== 'founder' && !isCommunityOwner) {
        senderCommunity.rewardPoints = (senderCommunity.rewardPoints || 0) - pointsNum;
      }
      senderCommunity.totalGiven = (senderCommunity.totalGiven || 0) + pointsNum;
      await sender.save();

      // Update recipient's community-specific points ONLY
      const recipientCommunity = recipient.communities.find(
        c => c.communityId.toString() === communityId.toString()
      );

      if (recipientCommunity) {
        // Add to claimablePoints (NOT rewardPoints - received points are claimable, not re-giftable)
        recipientCommunity.claimablePoints = (recipientCommunity.claimablePoints || 0) + pointsNum;
        recipientCommunity.totalReceived = (recipientCommunity.totalReceived || 0) + pointsNum;
      }
      await recipient.save();
    }

    res.json({
      message: needsApproval ? 'Transaction of over 100 points submitted for approval' : 'Points sent successfully',
      transaction: {
        id: transaction._id,
        points: transaction.points,
        message: transaction.message,
        recipient: recipient.name,
        status: transaction.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve a transaction (founder or community owner)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    // Check if user is founder or community owner
    const communityId = transaction.communityId.toString();
    const isFounder = req.user.role === 'founder';
    const userCommunity = req.user.communities?.find(
      c => c.communityId.toString() === communityId
    );
    const isCommunityOwner = userCommunity && userCommunity.role === 'owner';

    if (!isFounder && !isCommunityOwner) {
      return res.status(403).json({ message: 'Access denied. Founder or community owner role required.' });
    }

    const sender = await User.findById(transaction.fromUserId);
    const recipient = await User.findById(transaction.toUserId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'Sender or recipient not found.' });
    }

    // Find sender's community-specific balance
    const senderCommunity = sender.communities.find(
      c => c.communityId.toString() === transaction.communityId.toString()
    );

    if (!senderCommunity) {
      transaction.status = 'rejected';
      await transaction.save();
      return res.status(400).json({ message: 'Sender is not a member of this community. Transaction rejected.' });
    }

    const senderBalance = senderCommunity.rewardPoints || 0;

    if (senderBalance < transaction.points) {
      transaction.status = 'rejected';
      await transaction.save();
      return res.status(400).json({ message: 'Sender has insufficient points. Transaction rejected.' });
    }

    // Update sender's community-specific points ONLY
    senderCommunity.rewardPoints = (senderCommunity.rewardPoints || 0) - transaction.points;
    senderCommunity.totalGiven = (senderCommunity.totalGiven || 0) + transaction.points;

    // Update recipient's community-specific points ONLY
    const recipientCommunity = recipient.communities.find(
      c => c.communityId.toString() === transaction.communityId.toString()
    );

    if (recipientCommunity) {
      // Add to claimablePoints (NOT rewardPoints - received points are claimable, not re-giftable)
      recipientCommunity.claimablePoints = (recipientCommunity.claimablePoints || 0) + transaction.points;
      recipientCommunity.totalReceived = (recipientCommunity.totalReceived || 0) + transaction.points;
    }

    transaction.status = 'approved';

    await sender.save();
    await recipient.save();
    await transaction.save();

    res.json({ message: 'Transaction approved successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject a transaction (founder or community owner)
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    // Check if user is founder or community owner
    const communityId = transaction.communityId.toString();
    const isFounder = req.user.role === 'founder';
    const userCommunity = req.user.communities?.find(
      c => c.communityId.toString() === communityId
    );
    const isCommunityOwner = userCommunity && userCommunity.role === 'owner';

    if (!isFounder && !isCommunityOwner) {
      return res.status(403).json({ message: 'Access denied. Founder or community owner role required.' });
    }

    transaction.status = 'rejected';
    await transaction.save();

    res.json({ message: 'Transaction rejected successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, communityId, all = false } = req.query;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    // Build query
    let query = { communityId };

    // If 'all' is true, show all transactions in the community (for admins)
    // Otherwise, show only user's transactions
    if (!all || all === 'false') {
      query.$or = [{ fromUserId: userId }, { toUserId: userId }];
    }

    const transactions = await Transaction.find(query)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (founder or community owner scoped)
router.get('/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, communityId } = req.query;

    // Founders can view all (optionally filtered by community)
    if (req.user.role === 'founder') {
      const query = communityId ? { communityId } : {};
      const transactions = await Transaction.find(query)
        .populate('fromUserId', 'name email')
        .populate('toUserId', 'name email')
        .populate('communityId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return res.json(transactions);
    }

    // Community owners must provide communityId and be owner of that community
    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const userCommunity = req.user.communities?.find(
      c => c.communityId.toString() === communityId.toString()
    );

    if (!userCommunity || userCommunity.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Owner role for this community required.' });
    }

    const transactions = await Transaction.find({ communityId })
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .populate('communityId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;