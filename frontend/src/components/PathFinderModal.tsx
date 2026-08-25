import React, { useState } from 'react';
import { GitFork, ArrowRight, X } from 'lucide-react';

interface PathFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightPath?: (nodeIds: string[]) => void;
}

export default function PathFinderModal({ isOpen, onClose, onHighlightPath }: PathFinderModalProps) {
  const [target, setTarget] = useState<string>('rag-arch');
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTraverse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/path?target=${target}`);
      const data = await res.json();
      setPaths(data.paths || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 999 }}>
      <div className="glass-panel" style={{ background: '#090e1a', border: '1px solid var(--border-active)', borderRadius: 18, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 24, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitFork style={{ color: '#38bdf8', width: 20, height: 20 }} />
            <span>Multi-Hop Prerequisite Path Finder</span>
          </h3>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 10px' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Destination Skill</label>
            <select value={target} onChange={e => setTarget(e.target.value)} style={{ width: '100%' }}>
              <option value="rag-arch">RAG (Retrieval-Augmented Gen)</option>
              <option value="dist-sys">Distributed Systems Architecture</option>
              <option value="gnn-models">Graph Neural Networks (GNNs)</option>
              <option value="llm-finetuning">LLM Fine-Tuning</option>
              <option value="cloud-aws">AWS Cloud Architecture</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Action</label>
            <button onClick={handleTraverse} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 38 }}>
              {loading ? 'Traversing Graph...' : 'Find Dependency Chains'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ marginTop: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paths.map((p, idx) => (
            <div key={idx} className="interactive-card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#38bdf8', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>Chain #{idx + 1} ({p.hops} Hops)</span>
                <button
                  onClick={() => {
                    onHighlightPath?.(p.pathNodes.map((n: any) => n.id));
                    onClose();
                  }}
                  className="btn-secondary"
                  style={{ fontSize: 10, padding: '2px 8px' }}
                >
                  Highlight on Canvas
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {p.pathNodes.map((n: any, i: number) => (
                  <React.Fragment key={n.id}>
                    <span style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {n.name}
                    </span>
                    {i < p.pathNodes.length - 1 && (
                      <ArrowRight style={{ width: 14, height: 14, color: '#6366f1' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
