const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');

// User <-> Project (ownership)
User.hasMany(Project, { foreignKey: 'owner_id', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User <-> Project (membership via join table)
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', as: 'projects' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', as: 'members' });

// Project -> Tasks
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// User -> assigned Tasks
User.hasMany(Task, { foreignKey: 'assignee_id', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignee_id', as: 'assignee' });

module.exports = { User, Project, Task, ProjectMember };
