import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsApi, tasksApi } from '../../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_COLORS = { todo: '#7c6af7', in_progress: '#fbbf24', done: '#34d399' };
const PRIORITY_COLORS = { low: '#34d399', medium: '#fbbf24', high: '#f87171' };

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectsApi.list(), tasksApi.myTasks()])
      .then(([pRes, tRes]) => { setProjects(pRes.data.projects); setMyTasks(tRes.data.tasks); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const overdue = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');

  const stats = {
    totalProjects: projects.length,
    totalTasks: myTasks.length,
    completed: myTasks.filter(t => t.status === 'done').length,
    overdue: overdue.length,
  };

  // Chart data
  const statusData = [
    { name: 'To Do', value: myTasks.filter(t => t.status === 'todo').length, color: '#7c6af7' },
    { name: 'In Progress', value: myTasks.filter(t => t.status === 'in_progress').length, color: '#fbbf24' },
    { name: 'Done', value: myTasks.filter(t => t.status === 'done').length, color: '#34d399' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'High', value: myTasks.filter(t => t.priority === 'high').length, color: '#f87171' },
    { name: 'Medium', value: myTasks.filter(t => t.priority === 'medium').length, color: '#fbbf24' },
    { name: 'Low', value: myTasks.filter(t => t.priority === 'low').length, color: '#34d399' },
  ];

  const projectData = projects.slice(0, 6).map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    tasks: 0,
  }));

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Welcome back, {user.name} 👋</h1>
          <p className="subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📁</span>
          <span className="stat-value">{stats.totalProjects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{stats.totalTasks}</span>
          <span className="stat-label">My Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card stat-overdue">
          <span className="stat-icon">⚠️</span>
          <span className="stat-value">{stats.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      {/* Charts row */}
      {myTasks.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Tasks by Status</h3>
            {statusData.length > 0 ? (
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f0f5' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {statusData.map((d, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                      <span className="legend-val">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="empty">No tasks yet</p>}
          </div>

          <div className="chart-card">
            <h3>Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f0f5' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Progress Overview</h3>
            <div className="progress-overview">
              <div className="big-progress">
                <svg viewBox="0 0 100 100" className="circle-progress">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#7c6af7" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.completed / (stats.totalTasks || 1))}`}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <text x="50" y="46" textAnchor="middle" fill="#f0f0f5" fontSize="18" fontWeight="700">
                    {stats.totalTasks ? Math.round((stats.completed / stats.totalTasks) * 100) : 0}%
                  </text>
                  <text x="50" y="60" textAnchor="middle" fill="#8888aa" fontSize="9">done</text>
                </svg>
              </div>
              <div className="progress-stats">
                <div className="ps-row"><span className="ps-dot" style={{background:'#34d399'}} /><span>Done</span><strong>{stats.completed}</strong></div>
                <div className="ps-row"><span className="ps-dot" style={{background:'#fbbf24'}} /><span>Active</span><strong>{stats.totalTasks - stats.completed - stats.overdue}</strong></div>
                <div className="ps-row"><span className="ps-dot" style={{background:'#f87171'}} /><span>Overdue</span><strong>{stats.overdue}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-header">
            <h2>My Projects</h2>
            <Link to="/projects" className="btn btn-sm">View all →</Link>
          </div>
          <div className="card-list">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                <div className="project-card-icon">{p.name[0].toUpperCase()}</div>
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.description || 'No description'}</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && <p className="empty">No projects yet. <Link to="/projects">Create one →</Link></p>}
          </div>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>My Tasks</h2>
            <Link to="/tasks" className="btn btn-sm">View all →</Link>
          </div>
          <div className="card-list">
            {myTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="task-card">
                <div className="task-left">
                  <span className="task-status-dot" style={{ background: STATUS_COLORS[t.status] }} />
                  <span className="task-title">{t.title}</span>
                </div>
                <div className="task-meta">
                  <span className="badge" style={{ background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                  {t.project && <span className="project-name">{t.project.name}</span>}
                </div>
              </div>
            ))}
            {myTasks.length === 0 && <p className="empty">No tasks assigned to you yet.</p>}
          </div>
        </section>
      </div>

      {overdue.length > 0 && (
        <div className="overdue-banner">
          <span>⚠️ You have <strong>{overdue.length} overdue task{overdue.length > 1 ? 's' : ''}</strong></span>
          <div className="overdue-list">
            {overdue.map(t => (
              <span key={t.id} className="overdue-tag">{t.title}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
