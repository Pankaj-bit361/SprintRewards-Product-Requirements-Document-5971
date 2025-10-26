import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Community from '../models/Community.js';
import OTP from '../models/OTP.js';
import Invitation from '../models/Invitation.js';
import { auth } from '../middleware/auth.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';
import { createWeeklySprint } from '../services/sprintService.js';

const router = express.Router();

// Register (only for initial founder setup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // If trying to register a founder, check if one already exists
    if (role === 'founder') {
      const founderExists = await User.findOne({ role: 'founder' });
      if (founderExists) {
        return res.status(403).json({
          message: 'A founder account already exists. Cannot create another.'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'employee'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    let user = await User.findOne({ email }).populate('communities.communityId');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If user has no communities, create a default one
    if (!user.communities || user.communities.length === 0) {
      const defaultCommunity = new Community({
        name: `${user.name}'s Community`,
        description: 'Default community',
        owner: user._id,
        isDefault: true,
        members: [{
          userId: user._id,
          role: 'owner'
        }],
        admins: [user._id]
      });

      await defaultCommunity.save();

      // Add community to user
      user.communities = [{
        communityId: defaultCommunity._id,
        role: 'owner'
      }];
      user.currentCommunityId = defaultCommunity._id;
      await user.save();

      // Reload user with populated communities
      user = await User.findById(user._id).populate('communities.communityId');
    }

    // Set current community if not set
    if (!user.currentCommunityId && user.communities.length > 0) {
      user.currentCommunityId = user.communities[0].communityId._id;
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sprintPoints: user.sprintPoints,
        rewardPoints: user.rewardPoints,
        isEligible: user.isEligible,
        unlockedThisSprint: user.unlockedThisSprint,
        communities: user.communities,
        currentCommunityId: user.currentCommunityId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user with updated sprint data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('communities.communityId', 'name');
    
    // If user is employee, get fresh sprint data (skip for now to avoid errors)
    // Sprint data will be fetched on demand from the frontend
    if (user.role === 'employee') {
      try {
        // Initialize sprintData if not present
        if (!user.sprintData) {
          user.sprintData = {
            completedTasks: 0,
            totalTasks: 0,
            completionRate: 0,
            taskBreakdown: {
              completed: 0,
              inProgress: 0,
              todo: 0,
              blocked: 0
            },
            lastUpdated: new Date()
          };
          await user.save();
        }
      } catch (sprintError) {
        console.error('Error initializing sprint data for user:', sprintError);
        // Continue without sprint data
      }
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request OTP for login
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    // If user doesn't exist, create one with default community
    if (!user) {
      // For OTP login, we create user on first OTP verification
      // For now, just generate OTP
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    // Save OTP to database
    const otpRecord = new OTP({
      email,
      code: otp,
      expiresAt
    });

    await otpRecord.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user?.name || 'User');
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: 'OTP sent successfully',
      email,
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || 10) * 60
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, code: otp });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check attempts
    if (otpRecord.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS || 5)) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Maximum OTP attempts exceeded' });
    }

    // Find or create user
    let user = await User.findOne({ email }).populate('communities.communityId');
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Create new user - extract name from email
      const userName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      user = new User({
        name: userName,
        email,
        password: Math.random().toString(36).slice(-12), // Random password for OTP users
        sprintPoints: 0,
        rewardPoints: 0,
        isEligible: false,
        unlockedThisSprint: false
      });

      await user.save();

      // Create default community
      const defaultCommunity = new Community({
        name: `${user.name}'s Community`,
        description: 'Default community',
        owner: user._id,
        isDefault: true,
        members: [{
          userId: user._id,
          role: 'owner',
          joinedAt: new Date()
        }],
        admins: [user._id],
        settings: {
          pointsPerSprint: 12,           // Sprint points (max 12 for eligibility)
          rewardPointsPerSprint: 500,    // Reward points allocated each sprint
          eligibilityThreshold: 8,       // Sprint points needed for eligibility
          weekendUnlockEnabled: true
        }
      });

      await defaultCommunity.save();

      // Create first weekly sprint for the community
      try {
        await createWeeklySprint(defaultCommunity._id);
        console.log(`Created first sprint for community: ${defaultCommunity.name}`);
      } catch (sprintError) {
        console.error('Error creating first sprint:', sprintError);
      }

      // Add community to user
      user.communities = [{
        communityId: defaultCommunity._id,
        role: 'owner',
        joinedAt: new Date()
      }];
      user.currentCommunityId = defaultCommunity._id;
      await user.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(email, user.name);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      // Reload user with populated communities
      user = await User.findById(user._id).populate('communities.communityId');
    }

    // Check for pending invitations for this email
    const pendingInvitations = await Invitation.find({
      email: user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('communityId');

    if (pendingInvitations.length > 0) {
      console.log(`Found ${pendingInvitations.length} pending invitations for ${user.email}`);

      for (const invitation of pendingInvitations) {
        try {
          const community = await Community.findById(invitation.communityId);

          if (!community) {
            console.log(`Community not found for invitation: ${invitation._id}`);
            continue;
          }

          // Check if user is already a member
          const alreadyMember = community.members.some(m => m.userId.toString() === user._id.toString());

          if (!alreadyMember) {
            // Add user to community
            community.members.push({
              userId: user._id,
              role: invitation.role,
              joinedAt: new Date()
            });

            // If invited as admin, add to admins array
            if (invitation.role === 'admin') {
              community.admins.push(user._id);
            }

            community.stats.totalMembers = community.members.length;
            await community.save();

            // Add community to user with initial points
            // Owners get 0 points (they have unlimited), regular members get 500
            const initialPoints = invitation.role === 'owner' ? 0 : (community.settings?.rewardPointsPerSprint || 500);

            user.communities.push({
              communityId: community._id,
              role: invitation.role,
              joinedAt: new Date(),
              rewardPoints: initialPoints,
              claimablePoints: 0,
              totalGiven: 0,
              totalReceived: 0
            });

            console.log(`Added user ${user.email} to community ${community.name} as ${invitation.role} with ${initialPoints} initial points`);
          }

          // Mark invitation as accepted
          invitation.status = 'accepted';
          await invitation.save();
        } catch (inviteError) {
          console.error(`Error processing invitation ${invitation._id}:`, inviteError);
        }
      }

      // Save user with new communities
      await user.save();

      // Reload user with populated communities
      user = await User.findById(user._id).populate('communities.communityId');
    }

    // Existing user - ensure they have a current community
    if (!isNewUser) {
      if (!user.currentCommunityId && user.communities.length > 0) {
        user.currentCommunityId = user.communities[0].communityId;
        await user.save();
      }
    }

    // Mark OTP as verified and delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sprintPoints: user.sprintPoints || 0,
        rewardPoints: user.rewardPoints || 0,
        isEligible: user.isEligible || false,
        unlockedThisSprint: user.unlockedThisSprint || false,
        communities: user.communities || [],
        currentCommunityId: user.currentCommunityId
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;