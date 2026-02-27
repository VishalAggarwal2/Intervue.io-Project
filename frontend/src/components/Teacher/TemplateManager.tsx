import React, { useState, useEffect } from 'react';
import { PollTemplate, TemplateQuestion } from '../../types';
import { fetchTemplates, deleteTemplate } from '../../services/api';

interface TemplateManagerProps {
  onLoad: (q: TemplateQuestion) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onLoad }) => {
  const [templates, setTemplates] = useState<PollTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTemplates(await fetchTemplates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    await deleteTemplate(id);
    setTemplates((t) => t.filter((x) => x._id !== id));
  };

  if (loading) return <p className="muted" style={{ padding: '12px' }}>Loading templates...</p>;

  if (templates.length === 0)
    return (
      <div className="empty-state small">
        <p>No saved templates yet.</p>
        <p className="muted">Save a question as a template to reuse it later.</p>
      </div>
    );

  return (
    <ul className="template-list">
      {templates.map((tmpl) =>
        tmpl.questions.map((q, qi) => (
          <li key={`${tmpl._id}-${qi}`} className="template-item">
            <div className="template-info">
              <span className="template-name">{tmpl.name}</span>
              <span className="template-type type-badge">{q.type}</span>
              <span className="template-question">{q.question}</span>
            </div>
            <div className="template-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => onLoad(q)}>
                Load
              </button>
              <button
                className="btn btn-ghost btn-sm kick-btn"
                onClick={() => handleDelete(tmpl._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
  );
};

export default TemplateManager;
