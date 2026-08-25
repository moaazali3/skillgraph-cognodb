import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, User, Briefcase, HelpCircle, Compass, Sparkles, ArrowRight } from 'lucide-react';

interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
  marketDemand: number;
  description: string;
  requiredLevel: string;
  weight: number;
  currentLevel?: string;
  isAcquired: boolean;
  readinessBonus: number;
}

interface DeveloperProfile {
  id: string;
  name: string;
  title: string;
  experienceYears: number;
  avatar: string;
  bio: string;
  verifiedSkills: string[];
}

interface RoleItem {
  id: string;
  title: string;
  domain: string;
  baseSalary: string;
}

interface SkillGapAnalyzerProps {
  onHighlightPath?: (nodeIds: string[]) => void;
  selectedRoleId?: string;
}

export default function SkillGapAnalyzer({ onHighlightPath, selectedRoleId }: SkillGapAnalyzerProps) {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedDevId, setSelectedDevId] = useState<string>('dev-sarah');
  const [currentRoleId, setCurrentRoleId] = useState<string>(selectedRoleId || 'ai-systems-engineer');
  const [items, setItems] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync external role change if passed from RoleCatalog
  useEffect(() => {
    if (selectedRoleId) {
      setCurrentRoleId(selectedRoleId);
    }
  }, [selectedRoleId]);

  // Load devs and roles from live API
  useEffect(() => {
    async function loadMeta() {
      try {
        const [devsRes, rolesRes] = await Promise.all([
          fetch('/api/developers'),
          fetch('/api/roles')
        ]);
        const devsData = await devsRes.json();
        const rolesData = await rolesRes.json();
        if (devsData.developers?.length) setDevelopers(devsData.developers);
        if (rolesData.roles?.length) setRoles(rolesData.roles);
      } catch (e) {
        console.error('Failed loading developers/roles', e);
      }
    }
    loadMeta();
  }, []);

  // Fetch skill gap analysis whenever dev or role changes
  useEffect(() => {
    async function fetchGap() {
      setLoading(true);
      try {
        const res = await fetch(`/api/skill-gap?dev=${selectedDevId}&role=${currentRoleId}`);
        const data = await res.json();
        setItems(data.analysis || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchGap();
  }, [selectedDevId, currentRoleId]);

  const missing = items.filter(i => !i.isAcquired);
  const acquired = items.filter(i => i.isAcquired);
  const readiness = items.length ? Math.round((acquired.length / items.length) * 100) : 0;

  const currentDev = developers.find(d => d.id === selectedDevId) || developers[0] || {
    name: 'Sarah Al-Mansoor',
    title: 'Backend Python & .NET Engineer',
    verifiedSkills: ['Python Core', 'FastAPI', 'PostgreSQL', 'Redis']
  };

  const currentRole = roles.find(r => r.id === currentRoleId) || roles[0] || {
    title: 'AI / LLM Systems Engineer',
    baseSalary: '$165k - $225k'
  };

  const handleIlluminateRoadmap = () => {
    const missingIds = missing.map(m => m.skillId);
    if (missingIds.length > 0) {
      onHighlightPath?.(missingIds);
    } else {
      onHighlightPath?.(acquired.map(a => a.skillId));
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Explanatory Banner */}
      <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <HelpCircle style={{ color: '#818cf8', width: 22, height: 22, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
          <strong style={{ color: '#ffffff' }}>What does the Skill Gap & Roadmap Engine do?</strong><br />
          It compares a developer's current verified competencies against any target career role. Using <strong>CognoDB multi-hop graph traversals</strong>, it extracts missing skills and ranks them in the <strong>optimal prerequisite learning sequence</strong>.
        </div>
      </div>

      {/* Selectors Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Profile Picker */}
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(15,23,42,0.6)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>
            <User style={{ width: 14, height: 14 }} />
            <span>1. Current Developer Profile (Backend Loaded)</span>
          </label>
          <select
            value={selectedDevId}
            onChange={e => setSelectedDevId(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          >
            {developers.length > 0 ? (
              developers.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.title})</option>
              ))
            ) : (
              <>
                <option value="dev-sarah">Sarah Al-Mansoor (Backend Python & .NET)</option>
                <option value="dev-alex">Alex Chen (Full-Stack .NET Developer)</option>
                <option value="dev-marcus">Marcus Vance (Junior Systems & Cloud)</option>
                <option value="dev-elena">Elena Rostova (Data & BI Analyst)</option>
                <option value="dev-david">David Kim (Senior Systems Engineer)</option>
              </>
            )}
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Verified skills: <span style={{ color: '#cbd5e1' }}>{currentDev.verifiedSkills?.join(', ') || 'C#, SQL, Python'}</span>
          </div>
        </div>

        {/* Target Role Picker */}
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(15,23,42,0.6)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#eab308', marginBottom: 8 }}>
            <Briefcase style={{ width: 14, height: 14 }} />
            <span>2. Target Career Goal</span>
          </label>
          <select
            value={currentRoleId}
            onChange={e => setCurrentRoleId(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          >
            {roles.length > 0 ? (
              roles.map(r => (
                <option key={r.id} value={r.id}>{r.title} ({r.baseSalary})</option>
              ))
            ) : (
              <>
                <option value="ai-systems-engineer">AI / LLM Systems Engineer ($165k - $225k)</option>
                <option value="senior-fullstack">Senior Full-Stack Engineer ($140k - $185k)</option>
                <option value="cloud-devops-architect">Cloud & Platform Architect ($160k - $210k)</option>
                <option value="graph-knowledge-engineer">Graph Data & Knowledge Engineer ($150k - $200k)</option>
                <option value="systems-dist-engineer">High-Performance Systems Engineer ($170k - $230k)</option>
              </>
            )}
          </select>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Market salary compensation: <span style={{ color: '#34d399', fontWeight: 700 }}>{currentRole.baseSalary}</span>
          </div>
        </div>
      </div>

      {/* Match Readiness Gauge */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>Role Competency Match: </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: readiness >= 60 ? '#34d399' : '#fbbf24' }}>{readiness}%</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>({acquired.length} of {items.length} skills acquired)</span>
          </div>

          <button onClick={handleIlluminateRoadmap} className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px', color: '#38bdf8' }}>
            <Compass style={{ width: 14, height: 14 }} />
            <span>Illuminate Required Skills on Graph</span>
          </button>
        </div>

        <div style={{ width: '100%', height: 10, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${readiness}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #34d399)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Missing Skills */}
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle style={{ width: 16, height: 16 }} />
              <span>Missing Skills to Learn ({missing.length})</span>
            </h4>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ordered by graph dependency priority</span>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 20, textAlign: 'center' }}>Querying CognoDB dependency graph...</div>
          ) : missing.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#34d399', fontSize: 12, background: 'rgba(16,185,129,0.08)', borderRadius: 10 }}>
              🎉 Fully Qualified! All required skills for this role are already verified.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {missing.map((m, idx) => (
                <div key={m.skillId} className="interactive-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: '#ffffff', fontSize: 13 }}>{m.skillName}</strong>
                    </div>
                    <span style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(245,158,11,0.2)', padding: '2px 6px', borderRadius: 4 }}>
                      Req: {m.requiredLevel}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{m.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11 }}>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      {m.readinessBonus > 0 ? `✓ ${m.readinessBonus} Prerequisites Ready` : 'Foundational Step'}
                    </span>
                    <span style={{ color: '#38bdf8' }}>Demand: {m.marketDemand}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acquired Skills */}
        <div className="glass-panel" style={{ padding: 16, background: 'rgba(15, 23, 42, 0.6)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            <span>Already Acquired Competencies ({acquired.length})</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
            {acquired.map(a => (
              <div key={a.skillId} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#ffffff', fontSize: 13 }}>{a.skillName}</strong>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{a.category}</span>
                </div>
                <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                  {a.currentLevel || 'Verified'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
