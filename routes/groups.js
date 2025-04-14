const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const authenticateJWT = require('../middleware/auth'); // JWT middleware

// Place static routes first

// GET all users (for invite dropdown)
router.get('/allUsers', authenticateJWT, async (req, res) => {
  console.log('Fetching all users...');
  try {
    const users = await User.find(); // Fetch all users from the database
    console.log('Users fetched:', users);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Other endpoints

router.get('/page', (req, res) => {
  res.render('groupList');
});

router.get('/', authenticateJWT, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// Render the create group form
router.get('/create', authenticateJWT, (req, res) => {
  res.render('groupCreate', { currentUser: req.user });
});

// Handle group creation
router.post('/', authenticateJWT, async (req, res) => {
  const { title, members } = req.body;
  try {
    const group = new Group({
      title,
      members: [req.user.id, ...(members || [])]
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Error creating group.' });
  }
});

// Optional: Invite another user to the group
router.post('/:id/invite', authenticateJWT, async (req, res) => {
  const { userId } = req.body;
  try {
    const group = await Group.findById(req.params.id);
    if (!group || !group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite member.' });
  }
});

// **Dynamic route must be defined last**
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'username');
    if (!group || !group.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).send('Access denied.');
    }
    res.render('groupDetails', { group });
  } catch (err) {
    res.status(500).send('Error loading group.');
  }
});

module.exports = router;
