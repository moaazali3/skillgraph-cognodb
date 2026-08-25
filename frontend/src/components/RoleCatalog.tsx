import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Users, ChevronDown, ChevronUp, Compass, Target, Sparkles, Layers } from 'lucide-react';

export interface SalaryTier {
  level: string;
  salaryRange: string;
  experienceYears: string;
}

export interface RoleDetail {
  id: string;
  title: string;
  domain: string;
  seniorityLevel: string;
  baseSalary: string;
  description: string;
  iconName: string;
  marketGrowth: string;
  openPositions: number;
  salaryTiers: SalaryTier[];
  requiredSkills: string[];
}

interface RoleCatalogProps {
  onSelectRoleForGap?: (roleId: string) => void;
  onIlluminateRoleSkills?: (skillNames: string[]) => void;
}

export default function RoleCatalog({ onSelectRoleForGap, onIlluminateRoleSkills }: RoleCatalogProps) {
  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch('/api/roles');
        const data = await res.json();
        setRoles(data.roles || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRoles();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Intro Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase style={{ color: '#eab308', width: 20, height: 20 }} />
            <span>Enterprise Career Pathways & Compensation Benchmarks</span>
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time market roles and skill requirements loaded dynamically from the <strong>ASP.NET Core & CognoDB Backend</strong>.
          </p>
        </div>
        <span className="badge badge-dotnet">Live API Data (:5103)</span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>
          Loading career pathways from CognoDB...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
          {roles.map(r => {
            const isExpanded = expandedRoleId === r.id;
            return (
              <div key={r.id} className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', border: '1px solid rgba(234, 179, 8, 0.3)', marginBottom: 6 }}>
                      {r.domain}
                    </span>
                    <h4 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>{r.title}</h4>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    {r.baseSalary}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {r.description}
                </p>

                {/* Market Stats */}
                <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                    <TrendingUp style={{ width: 12, height: 12 }} />
                    <strong>{r.marketGrowth}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#cbd5e1' }}>
                    <Users style={{ width: 12, height: 12 }} />
                    {r.openPositions.toLocaleString()} Open Roles
                  </span>
                </div>

                {/* Required Skills from Graph */}
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Core Skill Requirements (CognoDB Graph):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.requiredSkills.map((s, idx) => (
                      <span key={idx} style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#93c5fd', padding: '3px 8px', borderRadius: 6, fontSize: 10, border: '1px solid rgba(147, 197, 253, 0.2)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expandable Salary Tiers Breakdown */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                  <button
                    onClick={() => setExpandedRoleId(isExpanded ? null : r.id)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', color: '#cbd5e1', fontSize: 11, fontWeight: 700, padding: '4px 0' }}
                  >
                    <span>Seniority Salary Breakdown (Intern ➔ Senior)</span>
                    {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(15, 23, 42, 0.8)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      {r.salaryTiers.map((tier, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{tier.level} ({tier.experienceYears})</span>
                          <span style={{ color: '#34d399', fontWeight: 700 }}>{tier.salaryRange}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                  <button
                    onClick={() => onSelectRoleForGap?.(r.id)}
                    className="btn-primary"
                    style={{ fontSize: 11, padding: '6px 10px', justifyContent: 'center' }}
                  >
                    <Target style={{ width: 12, height: 12 }} />
                    <span>Check Skill Gap</span>
                  </button>

                  <button
                    onClick={() => onIlluminateRoleSkills?.(r.requiredSkills)}
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: '6px 10px', justifyContent: 'center', color: '#38bdf8' }}
                  >
                    <Compass style={{ width: 12, height: 12 }} />
                    <span>View on Graph</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
