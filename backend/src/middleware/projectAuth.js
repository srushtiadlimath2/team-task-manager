const { ProjectMember, Project } = require('../models');

// Check if the user is a member (or admin) of the project
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Global admins pass through
    if (req.user.role === 'admin' || project.ownerId === req.user.id) {
      req.project = project;
      return next();
    }

    const membership = await ProjectMember.findOne({
      where: { projectId, userId: req.user.id },
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    req.project = project;
    req.projectRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

// Only project admins or owner
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'admin' || project.ownerId === req.user.id) {
      req.project = project;
      return next();
    }

    const membership = await ProjectMember.findOne({
      where: { projectId, userId: req.user.id },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Project admin access required' });
    }

    req.project = project;
    req.projectRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProjectMember, requireProjectAdmin };
