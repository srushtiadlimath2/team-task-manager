const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Task, User, Project } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/projectAuth');

router.use(authenticate);

// GET /api/tasks?projectId=X — tasks for a project
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, assigneeId } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/my — tasks assigned to me
router.get('/my', async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: { assigneeId: req.user.id },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['dueDate', 'ASC']],
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('projectId').isInt(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;

      const task = await Task.create({ title, description, status, priority, dueDate, projectId, assigneeId });
      const full = await Task.findByPk(task.id, {
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
      });

      res.status(201).json({ task: full });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    await task.update({ title, description, status, priority, dueDate, assigneeId });

    const updated = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
    });

    res.json({ task: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only project admin/owner or global admin can delete
    if (req.user.role !== 'admin') {
      const project = await Project.findByPk(task.projectId);
      if (project.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
