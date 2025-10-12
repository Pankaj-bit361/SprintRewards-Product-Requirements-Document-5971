import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { auth, isFounder } from '../middleware/auth.js';

const router = express.Router();

// Send points to another user
router.post('/send', auth, async (req, res) => {
  try {
    const { toUserId, points, message } = req.body;
    const fromUserId = req.user._id;

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: 'Cannot send points to yourself' });
    }

    const sender = await User.findById(fromUserId);
    const recipient = await User.findById(toUserId);

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const pointsNum = Number(points);

    // Bypass balance check for founder, but check for employees
    if (sender.role !== 'founder' && sender.rewardPoints < pointsNum) {
      return res.status(400).json({ message: 'Insufficient reward points' });
    }

    // Check if transaction needs approval
    const needsApproval = sender.role !== 'founder' && pointsNum > 100;

    const transaction = new Transaction({
      fromUserId,
      toUserId,
      points: pointsNum,
      message,
      type: 'transfer',
      status: needsApproval ? 'pending' : 'approved',
    });
    await transaction.save();

    if (!needsApproval) {
      // Do not decrement founder's points
      if (sender.role !== 'founder') {
        sender.rewardPoints -= pointsNum;
      }
      sender.totalGiven += pointsNum;
      await sender.save();

      recipient.rewardPoints += pointsNum;
      recipient.totalReceived += pointsNum;
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

// Approve a transaction (founder only)
router.post('/:id/approve', auth, isFounder, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    const sender = await User.findById(transaction.fromUserId);
    const recipient = await User.findById(transaction.toUserId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'Sender or recipient not found.' });
    }

    if (sender.rewardPoints < transaction.points) {
      transaction.status = 'rejected';
      await transaction.save();
      return res.status(400).json({ message: 'Sender has insufficient points. Transaction rejected.' });
    }

    sender.rewardPoints -= transaction.points;
    sender.totalGiven += transaction.points;
    
    recipient.rewardPoints += transaction.points;
    recipient.totalReceived += transaction.points;

    transaction.status = 'approved';

    await sender.save();
    await recipient.save();
    await transaction.save();

    res.json({ message: 'Transaction approved successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject a transaction (founder only)
router.post('/:id/reject', auth, isFounder, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found.' });
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
    const { page = 1, limit = 10 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    })
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    });

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions (founder only)
router.get('/all', auth, isFounder, async (req, res) => {
  try {
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
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;