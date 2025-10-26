import express from 'express';
import crypto from 'crypto';
import Community from '../models/Community.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { auth } from '../middleware/auth.js';
import { createWeeklySprint } from '../services/sprintService.js';
import { sendInvitationEmail } from '../services/emailService.js';

const router = express.Router();

// Get all communities for current user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('communities.communityId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      communities: user.communities,
      currentCommunityId: user.currentCommunityId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single community details
router.get('/:communityId', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId)
      .populate('owner', 'name email')
      .populate('members.userId', 'name email')
      .populate('admins', 'name email');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Filter out members with null userId (deleted users)
    community.members = community.members.filter(m => m.userId !== null);

    // Check if user is member of this community
    const isMember = community.members.some(m => m.userId._id.toString() === req.user._id.toString());
    if (!isMember && community.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get community members (for dropdowns, etc.)
router.get('/:communityId/members', auth, async (req, res) => {
  try {
    const { includeAll } = req.query;

    const community = await Community.findById(req.params.communityId)
      .populate('members.userId', 'name email _id role rewardPoints totalGiven totalReceived sprintPoints isEligible avatar');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Filter out members with null userId (deleted users)
    const validMembers = community.members.filter(m => m.userId !== null);

    // Check if user is member of this community
    const isMember = validMembers.some(m => m.userId._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return members
    let members = validMembers.map(m => {
      // Find community-specific data
      const userCommunity = m.userId.communities?.find(
        c => c.communityId.toString() === req.params.communityId.toString()
      );

      return {
        _id: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        role: m.userId.role, // Global role (founder/employee)
        communityRole: m.role, // Community role (owner/admin/member)
        rewardPoints: userCommunity?.rewardPoints || 0, // Community-specific
        claimablePoints: userCommunity?.claimablePoints || 0, // Community-specific
        totalGiven: userCommunity?.totalGiven || 0, // Community-specific
        totalReceived: userCommunity?.totalReceived || 0, // Community-specific
        sprintPoints: m.userId.sprintPoints || 0,
        isEligible: m.userId.isEligible || false,
        avatar: m.userId.avatar
      };
    });

    // Exclude current user unless includeAll is true
    if (!includeAll || includeAll === 'false') {
      members = members.filter(m => m._id.toString() !== req.user._id.toString());
    }

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new community
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const community = new Community({
      name,
      description,
      image,
      owner: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'owner'
      }],
      admins: [req.user._id]
    });

    await community.save();

    // Create first weekly sprint for the community
    try {
      await createWeeklySprint(community._id);
      console.log(`Created first sprint for community: ${community.name}`);
    } catch (sprintError) {
      console.error('Error creating first sprint:', sprintError);
    }

    // Add community to user
    const user = await User.findById(req.user._id);
    user.communities.push({
      communityId: community._id,
      role: 'owner'
    });
    await user.save();

    res.status(201).json({
      message: 'Community created successfully',
      community
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invite user to community
router.post('/:communityId/invite', auth, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const { communityId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if requester is owner
    const isOwner = community.owner.toString() === req.user._id.toString();

    // Check if requester is admin
    const isAdmin = community.admins.includes(req.user._id) || isOwner;

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can invite users' });
    }

    // Only owner can invite as admin
    if (role === 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Only community owner can invite admins' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // USER EXISTS - Add them directly to community

      // Check if already member
      const alreadyMember = community.members.some(m => m.userId.toString() === existingUser._id.toString());
      if (alreadyMember) {
        return res.status(400).json({ message: 'User is already a member' });
      }

      // Add user to community with specified role
      community.members.push({
        userId: existingUser._id,
        role: role
      });

      // If inviting as admin, add to admins array
      if (role === 'admin') {
        community.admins.push(existingUser._id);
      }

      community.stats.totalMembers = community.members.length;
      await community.save();

      // Add community to user with specified role and initial points
      // Owners get 0 points (they have unlimited), regular members get 500
      const initialPoints = role === 'owner' ? 0 : (community.settings?.rewardPointsPerSprint || 500);

      existingUser.communities.push({
        communityId: community._id,
        role: role,
        rewardPoints: initialPoints,
        claimablePoints: 0,
        totalGiven: 0,
        totalReceived: 0
      });
      await existingUser.save();

      return res.json({
        message: `User added to community as ${role} successfully`,
        userExists: true,
        community
      });

    } else {
      // USER DOESN'T EXIST - Create invitation

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        email,
        communityId,
        status: 'pending'
      });

      if (existingInvitation) {
        return res.status(400).json({ message: 'Invitation already sent to this email' });
      }

      // Generate unique invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');

      // Create invitation
      const invitation = new Invitation({
        email,
        communityId: community._id,
        role,
        invitedBy: req.user._id,
        token: invitationToken,
        status: 'pending'
      });

      await invitation.save();

      // Send invitation email
      try {
        await sendInvitationEmail(
          email,
          community.name,
          req.user.name,
          role,
          invitationToken
        );
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }

      return res.json({
        message: `Invitation sent to ${email} as ${role}`,
        userExists: false,
        invitation: {
          email,
          role,
          token: invitationToken
        }
      });
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Set current community
router.post('/:communityId/set-current', auth, async (req, res) => {
  try {
    const { communityId } = req.params;

    const user = await User.findById(req.user._id);
    const isMember = user.communities.some(c => c.communityId.toString() === communityId);

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this community' });
    }

    user.currentCommunityId = communityId;
    await user.save();

    res.json({
      message: 'Current community updated',
      currentCommunityId: communityId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update community settings (owner/admin only)
router.put('/:communityId', auth, async (req, res) => {
  try {
    const { name, description, image, settings } = req.body;
    const { communityId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if requester is owner
    if (community.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can update community' });
    }

    if (name) community.name = name;
    if (description !== undefined) community.description = description;
    if (image !== undefined) community.image = image;
    if (settings) community.settings = { ...community.settings, ...settings };

    await community.save();

    res.json({
      message: 'Community updated successfully',
      community
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from community (owner/admin only)
router.delete('/:communityId/members/:userId', auth, async (req, res) => {
  try {
    const { communityId, userId } = req.params;

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check if requester is owner or admin
    const requesterMember = community.members.find(
      m => m.userId.toString() === req.user._id.toString()
    );

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      return res.status(403).json({ message: 'Only owners and admins can remove members' });
    }

    // Cannot remove yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself from the community' });
    }

    // Cannot remove the owner
    if (community.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the community owner' });
    }

    // Remove from community members
    community.members = community.members.filter(
      m => m.userId.toString() !== userId
    );
    await community.save();

    // Remove from user's communities array
    const user = await User.findById(userId);
    if (user) {
      user.communities = user.communities.filter(
        c => c.communityId.toString() !== communityId
      );
      await user.save();
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

