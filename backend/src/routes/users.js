const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users — list all users (for assigning tasks / adding members)
router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({ role: req.body.role });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
