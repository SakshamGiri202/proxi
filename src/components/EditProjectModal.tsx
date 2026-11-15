import React, { useState } from 'react';
import type { Project } from '@/types';
import { supabase } from '@/lib/supabase';
import { X, ArrowRight, Sparkles } from 'lucide-react';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  onClose,
  onUpdated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const updated = {
      name: String(form.get('name')),
      client_name: String(form.get('client_name')),
      description: String(form.get('description')),
      progress_summary: String(form.get('progress_summary')),
      open_issues: String(form.get('open_issues')),
      health: String(form.get('health')) as Project['health'],
      github_url: String(form.get('github_url')),
      management_url: String(form.get('management_url')),
    };

    const { error: updateError } = await supabase
      .from('projects')
      .update(updated)
      .eq('id', project.id);

    setIsSaving(false);

    if (updateError) {
      setError('Could not update project context. Please try again.');
      return;
    }

    onUpdated();
    onClose();
  }

  return (
    <div className="setup-backdrop" onMouseDown={onClose}>
      <div className="setup-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="demo-close" onClick={onClose}>
          <X size={18} />
        </button>

        <span className="eyebrow">
          <Sparkles size={13} /> Update Project Context
        </span>
        <h2>
          Refresh Context for<br />
          <em>{project.name}</em>
        </h2>
        <p className="setup-intro">
          Proxi uses this context in all live briefings and Q&A responses. Keep it updated as progress is made.
        </p>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-form-grid">
            <label>
              Project name
              <input name="name" required defaultValue={project.name} />
            </label>
            <label>
              Client or team
              <input name="client_name" required defaultValue={project.client_name} />
            </label>
          </div>

          <label>
            Project health status
            <select
              name="health"
              defaultValue={project.health}
              className="health-select-input"
            >
              <option value="On track">On track (Green)</option>
              <option value="At risk">At risk (Yellow)</option>
              <option value="Delayed">Delayed (Red)</option>
            </select>
          </label>

          <label>
            Project overview
            <textarea name="description" required defaultValue={project.description} />
          </label>

          <div className="setup-form-grid">
            <label>
              GitHub repository URL
              <input name="github_url" type="url" defaultValue={project.github_url || ''} />
            </label>
            <label>
              Management tool link (Linear, Jira, Notion)
              <input name="management_url" type="url" defaultValue={project.management_url || ''} />
            </label>
          </div>

          <div className="setup-form-grid">
            <label>
              Current progress summary
              <textarea name="progress_summary" required defaultValue={project.progress_summary} />
            </label>
            <label>
              Open issues or risks
              <textarea name="open_issues" defaultValue={project.open_issues} />
            </label>
          </div>

          <button className="dark-button setup-submit" disabled={isSaving}>
            {isSaving ? 'Saving Updates...' : 'Save Context'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
