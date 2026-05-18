import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const load = () =>
    projectsApi.list()
      .then((r) => setProjects(r.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectsApi.create(form);
      toast.success('Project created!');
      setForm({ name: '', description: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectsApi.delete(id);
      toast.success('Project deleted');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h3>New Project</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      <div className="projects-grid">
        {projects.map((p) => (
          <div key={p.id} className="card project-card-big">
            <Link to={`/projects/${p.id}`}>
              <h3>{p.name}</h3>
              <p>{p.description || 'No description'}</p>
              <span className="owner-label">Owner: {p.owner?.name}</span>
            </Link>
            <div className="card-actions">
              <Link to={`/projects/${p.id}`} className="btn btn-sm">Open</Link>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="empty">No projects yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
