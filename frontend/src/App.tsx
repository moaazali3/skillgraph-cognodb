import React, { useState, useEffect } from 'react';
import { Network, GitFork, Target, Briefcase, Terminal, Database, Sparkles, Layers, Zap, Compass, CheckCircle } from 'lucide-react';
import GraphCanvas, { type InputNode } from './components/GraphCanvas';
import SkillGapAnalyzer from './components/SkillGapAnalyzer';
import RoleCatalog from './components/RoleCatalog';
import QueryInspector from './components/QueryInspector';
import PathFinderModal from './components/PathFinderModal';
import ConnectionStatus from './components/ConnectionStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState<'graph' | 'analyzer' | 'roles' | 'queries'>('graph');
  const [graphData, setGraphData] = useState<{ nodes: InputNode[]; links: any[] }>({ nodes: [], links: [] });
  const [highlightedPathIds, setHighlightedPathIds] = useState<string[]>([]);
  const [isPathModalOpen, setIsPathModalOpen] = useState<boolean>(false);
  const [modalTargetSkill, setModalTargetSkill] = useState<string>('rag-arch');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const loadGraph = async () => {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      setGraphData({ nodes: data.nodes || [], links: data.links || [] });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to re-seed CognoDB?')) return;
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Database seeded successfully!');
      loadGraph();
    } catch (e) {
      alert('Seed failed: ' + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTracePathFromGraph = (skillId: string) => {
    setModalTargetSkill(skillId);
    setIsPathModalOpen(true);
  };

  return (
    <div className="container" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <header className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            <Network style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Skill<span style={{ color: '#38bdf8' }}>Graph</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Interactive Tech Career & Skill Dependency Knowledge Graph on CognoDB Cloud
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setIsPathModalOpen(true)} className="btn-secondary">
            <GitFork style={{ color: '#38bdf8', width: 16, height: 16 }} />
            <span>Prerequisite Path Finder</span>
          </button>
          <button onClick={handleSeed} disabled={isSeeding} className="btn-primary">
            <Database style={{ width: 16, height: 16 }} />
            <span>{isSeeding ? 'Seeding...' : 'Re-Seed CognoDB'}</span>
          </button>
        </div>
      </header>

      {/* Quick Walkthrough / Architecture Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles style={{ width: 16, height: 16, color: '#38bdf8' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            How to explore this application (Technical Review Guide):
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, fontSize: 12 }}>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: 4 }}>1. Left-to-Right Skill Roadmap</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              Skills flow from <strong>Foundation (Left)</strong> ➔ <strong>Core Stack</strong> ➔ <strong>Specializations</strong> ➔ <strong>Roles (Right)</strong>. Click any node to inspect prerequisite chains.
            </p>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#a855f7', display: 'block', marginBottom: 4 }}>2. Skill Gap & Readiness</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              Select a developer profile and target role to calculate missing competencies and ordered learning roadmaps.
            </p>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ color: '#34d399', display: 'block', marginBottom: 4 }}>3. Live openCypher Console</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              Execute real-time multi-hop graph queries against CognoDB Cloud with latency benchmarks.
            </p>
          </div>
        </div>
      </div>

      {/* Database Connection Status */}
      <ConnectionStatus />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('graph')}
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, background: activeTab === 'graph' ? '#4f46e5' : 'transparent', color: activeTab === 'graph' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          <Network style={{ width: 16, height: 16 }} />
          <span>Interactive Skill Roadmap</span>
        </button>

        <button
          onClick={() => setActiveTab('analyzer')}
          className={`tab-btn ${activeTab === 'analyzer' ? 'active' : ''}`}
          style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, background: activeTab === 'analyzer' ? '#4f46e5' : 'transparent', color: activeTab === 'analyzer' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          <Target style={{ width: 16, height: 16 }} />
          <span>Skill Gap & Roadmap Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, background: activeTab === 'roles' ? '#4f46e5' : 'transparent', color: activeTab === 'roles' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          <Briefcase style={{ width: 16, height: 16 }} />
          <span>Career Roles & Market Demand</span>
        </button>

        <button
          onClick={() => setActiveTab('queries')}
          className={`tab-btn ${activeTab === 'queries' ? 'active' : ''}`}
          style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, background: activeTab === 'queries' ? '#4f46e5' : 'transparent', color: activeTab === 'queries' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          <Terminal style={{ width: 16, height: 16 }} />
          <span>openCypher Console</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'graph' && (
        <div>
          <GraphCanvas
            nodes={graphData.nodes}
            links={graphData.links}
            highlightedPathNodeIds={highlightedPathIds}
            onTracePathTo={handleTracePathFromGraph}
            onClearHighlights={() => setHighlightedPathIds([])}
          />
          <div className="glass-panel" style={{ marginTop: 14, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              💡 <strong>Interaction Guide:</strong> Drag to pan the canvas, click any skill to inspect its incoming/outgoing dependencies, or illuminate multi-hop paths below.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setHighlightedPathIds(['python', 'math-stats', 'pandas-numpy', 'pytorch', 'transformers', 'rag-arch'])}
                className="btn-secondary"
                style={{ fontSize: 11, padding: '6px 12px', color: '#38bdf8' }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                <span>Illuminate AI / RAG 5-Hop Path</span>
              </button>
              {highlightedPathIds.length > 0 && (
                <button
                  onClick={() => setHighlightedPathIds([])}
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '6px 10px', color: '#cbd5e1' }}
                >
                  Clear Highlights
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analyzer' && (
        <SkillGapAnalyzer
          selectedRoleId={modalTargetSkill}
          onHighlightPath={ids => {
            setHighlightedPathIds(ids);
            setActiveTab('graph');
          }}
        />
      )}

      {activeTab === 'roles' && (
        <RoleCatalog
          onSelectRoleForGap={roleId => {
            setModalTargetSkill(roleId);
            setActiveTab('analyzer');
          }}
          onIlluminateRoleSkills={skills => {
            // Find matching node IDs by label or skill names
            const skillIds = graphData.nodes
              .filter(n => skills.some(s => s.toLowerCase() === n.label.toLowerCase() || n.label.toLowerCase().includes(s.toLowerCase())))
              .map(n => n.id);
            setHighlightedPathIds(skillIds);
            setActiveTab('graph');
          }}
        />
      )}

      {activeTab === 'queries' && <QueryInspector />}

      {/* Multi-Hop Path Modal */}
      <PathFinderModal
        isOpen={isPathModalOpen}
        onClose={() => setIsPathModalOpen(false)}
        onHighlightPath={ids => {
          setHighlightedPathIds(ids);
          setActiveTab('graph');
        }}
      />
    </div>
  );
}
