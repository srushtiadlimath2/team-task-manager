import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi, tasksApi, usersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: '#7c6af7', in_progress: '#fbbf24', done: '#34d399' };
const PRIORITY_COLORS = { low: '#34d399', medium: '#fbbf24', high: '#f87171' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');

  const load = () =>
    Promise.all([projectsApi.get(id), usersApi.list()])
      .then(([pRes, uRes]) => { setProject(pRes.data.project); setAllUsers(uRes.data.users); })
      .catch(() => toast.error('Failed to load project'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await tasksApi.create({ ...taskForm, projectId: id });
      toast.success('Task created!');
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
      setShowTaskForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setCreating(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      setProject((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask || draggedTask.status === newStatus) { setDraggedTask(null); return; }
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => t.id === draggedTask.id ? { ...t, status: newStatus } : t),
    }));
    try {
      await tasksApi.update(draggedTask.id, { status: newStatus });
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
    } catch { toast.error('Failed to move task'); load(); }
    setDraggedTask(null);
  };

  const isOwner = project?.ownerId === user?.id;
  const canManage = isAdmin || isOwner;

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found.</div>;

  const filteredTasks = (project.tasks || []).filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const total = project.tasks?.length || 0;
  const done = project.tasks?.filter(t => t.status === 'done').length || 0;
  const completionPct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ flex: 1 }}>
          <h1>{project.name}</h1>
          {project.description && <p className="subtitle">{project.description}</p>}
          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <span className="progress-label">{completionPct}% complete · {done}/{total} tasks</span>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
            {showTaskForm ? 'Cancel' : '+ Add Task'}
          </button>
        )}
      </div>

      <div className="card members-card">
        <h3>Team Members</h3>
        <div className="members-list">
          {project.members?.map((m) => (
            <div key={m.id} className="member-chip">
              <div className="member-avatar">{m.name[0].toUpperCase()}</div>
              <span>{m.name}</span>
              <span className="role-badge">{m.ProjectMember?.role || 'member'}</span>
            </div>
          ))}
        </div>
      </div>

      {showTaskForm && (
        <form className="card form-card" onSubmit={handleCreateTask}>
          <h3>New Task</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
              <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due date</label>
              <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      )}

      <div className="kanban-filters">
        <input className="search-input" placeholder="🔍  Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <select className="filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      <div className="kanban">
        {STATUSES.map((status) => (
          <div
            key={status}
            className={`kanban-col${dragOverCol === status ? ' drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDrop={(e) => handleDrop(e, status)}
            onDragLeave={() => setDragOverCol(null)}
          >
            <div className="kanban-header" style={{ borderTopColor: STATUS_COLORS[status] }}>
              <span>{STATUS_LABELS[status]}</span>
              <span className="count">{tasksByStatus[status].length}</span>
            </div>
            <div className="kanban-tasks">
              {tasksByStatus[status].map((task) => (
                <div
                  key={task.id}
                  className={`task-card-kanban${draggedTask?.id === task.id ? ' dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={() => { setDraggedTask(null); setDragOverCol(null); }}
                >
                  <div className="task-title-row">
                    <strong>{task.title}</strong>
                    {canManage && <button className="btn-icon" onClick={() => handleDeleteTask(task.id)}>×</button>}
                  </div>
                  <div className="task-badges">
                    <span className="priority-pip" style={{ background: PRIORITY_COLORS[task.priority] }} />
                    <span style={{ fontSize: '11px', color: PRIORITY_COLORS[task.priority], fontWeight: 600 }}>{task.priority}</span>
                  </div>
                  {task.assignee && (
                    <p className="assignee">
                      <span className="mini-avatar">{task.assignee.name[0].toUpperCase()}</span>
                      {task.assignee.name}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className={`due-date${new Date(task.dueDate) < new Date() && task.status !== 'done' ? ' overdue' : ''}`}>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="drag-hint">⠿ drag to move</p>
                </div>
              ))}
              {tasksByStatus[status].length === 0 && (
                <div className={`empty-col${dragOverCol === status ? ' drop-here' : ''}`}>
                  {dragOverCol === status ? '✦ Drop here' : 'No tasks'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
