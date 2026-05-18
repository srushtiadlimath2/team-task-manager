const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Project, ProjectMember, User, Task } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAuth');

// All project routes require login
router.use(authenticate);

// GET /api/projects — list projects the user belongs to
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'members',
          where: { id: req.user.id },
          attributes: [],
          through: { attributes: [] },
          required: false,
        },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
      ],
      where: req.user.role === 'admin' ? {} : { '$members.id$': req.user.id },
    });

    // For non-admin, also include owned projects
    if (req.user.role !== 'admin') {
      const owned = await Project.findAll({
        where: { ownerId: req.user.id },
        include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      });
      const ids = new Set(projects.map((p) => p.id));
      owned.forEach((p) => { if (!ids.has(p.id)) projects.push(p); });
    }

    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project
router.post(
  '/',
  [body('name').trim().notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const project = await Project.create({
        name: req.body.name,
        description: req.body.description,
        ownerId: req.user.id,
      });

      // Add creator as admin member
      await ProjectMember.create({ projectId: project.id, userId: req.user.id, role: 'admin' });

      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:projectId
router.get('/:projectId', requireProjectMember, async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: ['role'] },
        },
        {
          model: Task,
          as: 'tasks',
          include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
        },
      ],
    });
    res.json({ project });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:projectId
router.patch('/:projectId', requireProjectAdmin, async (req, res, next) => {
  try {
    await req.project.update({ name: req.body.name, description: req.body.description });
    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireProjectAdmin, async (req, res, next) => {
  try {
    await req.project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/members — add member
router.post('/:projectId/members', requireProjectAdmin, async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [member, created] = await ProjectMember.findOrCreate({
      where: { projectId: req.params.projectId, userId },
      defaults: { role: role || 'member' },
    });

    if (!created) return res.status(409).json({ message: 'Already a member' });
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectAdmin, async (req, res, next) => {
  try {
    await ProjectMember.destroy({
      where: { projectId: req.params.projectId, userId: req.params.userId },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
