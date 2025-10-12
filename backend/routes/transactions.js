import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Send points to another user
router.post('/send', auth, async (req, res) => {
  try {
    const { toUserId, points, message } = req.body;
    const fromUserId = req.user._id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: 'Cannot send points to yourself' });
    }

    // Check sender's balance
    const sender = await User.findById(fromUserId);
    if (sender.rewardPoints < points) {
      return res.status(400).json({ message: 'Insufficient reward points' });
    }

    // Check if recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create transaction
    const transaction = new Transaction({
      fromUserId,
      toUserId,
      points,
      message,
      type: 'transfer'
    });

    await transaction.save();

    // Update balances
    sender.rewardPoints -= points;
    sender.totalGiven += points;
    await sender.save();

    recipient.rewardPoints += points;
    recipient.totalReceived += points;
    await recipient.save();

    res.json({
      message: 'Points sent successfully',
      transaction: {
        id: transaction._id,
        points,
        message,
        recipient: recipient.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    })
    .populate('fromUserId', 'name email')
    .populate('toUserId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Transaction.countDocuments({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    });

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (founder only)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'founder') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find()
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments();

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;