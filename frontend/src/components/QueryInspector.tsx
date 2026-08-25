import React, { useState } from 'react';
import { Terminal, Play } from 'lucide-react';

const PRESET_QUERIES = {
  path: {
    title: '1. Multi-Hop Prerequisite Path Traversal (5 Hops Deep)',
    cypher: `MATCH path = (prereq:Skill)-[:PREREQUISITE_FOR*1..5]->(target:Skill {id: 'rag-arch'})
RETURN [n IN nodes(path) | n.name] AS pathChain, length(path) AS hops ORDER BY hops DESC`,
    url: '/api/path?target=rag-arch'
  },
  gap: {
    title: '2. Skill Gap & Graph Prerequisite Readiness Score',
    cypher: `MATCH (d:Developer {id: 'dev-sarah'}) MATCH (r:Role {id: 'ai-systems-engineer'})-[:REQUIRES_SKILL]->(s:Skill)
RETURN s.name AS neededSkill, NOT (d)-[:PROFICIENT_IN]->(s) AS isMissing`,
    url: '/api/skill-gap?dev=dev-sarah&role=ai-systems-engineer'
  },
  roi: {
    title: '3. Career Pivot Degree Centrality (Highest ROI Next Skill)',
    cypher: `MATCH (d:Developer {id: 'dev-alex'}) MATCH (s:Skill) WHERE NOT (d)-[:PROFICIENT_IN]->(s)
MATCH (r:Role)-[:REQUIRES_SKILL]->(s) RETURN s.name, count(DISTINCT r) AS unlockedRolesCount ORDER BY unlockedRolesCount DESC LIMIT 5`,
    url: '/api/skill-gap/roi?dev=dev-alex'
  }
};

export default function QueryInspector() {
  const [selectedKey, setSelectedKey] = useState<'path' | 'gap' | 'roi'>('path');
  const [result, setResult] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const query = PRESET_QUERIES[selectedKey];

  const handleExecute = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(query.url);
      const data = await res.json();
      setResult(data);
      setLatency(Math.round(performance.now() - start));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal style={{ color: '#ec4899', width: 20, height: 20 }} />
          <span>CognoDB openCypher Runner (ASP.NET Core Backend)</span>
        </h3>
        <button onClick={handleExecute} disabled={loading} className="btn-primary">
          <Play style={{ width: 14, height: 14 }} />
          <span>{loading ? 'Executing...' : 'Execute Query'}</span>
        </button>
      </div>

      <select
        value={selectedKey}
        onChange={e => {
          setSelectedKey(e.target.value as any);
          setResult(null);
          setLatency(null);
        }}
        style={{ width: '100%' }}
      >
        <option value="path">1. Multi-Hop Prerequisite Path Traversal (5 Hops Deep)</option>
        <option value="gap">2. Skill Gap & Graph Prerequisite Readiness Score</option>
        <option value="roi">3. Career Pivot Degree Centrality (Highest ROI Next Skill)</option>
      </select>

      <div className="code-box">
        <pre>{query.cypher}</pre>
      </div>

      <div className="glass-panel" style={{ padding: 16, background: '#050811' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span>Response Payload (JSON)</span>
          {latency !== null && (
            <span style={{ color: '#34d399', fontWeight: 600 }}>Execution Time: {latency}ms</span>
          )}
        </div>
        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#38bdf8', maxHeight: 260, overflow: 'auto' }}>
          {result ? JSON.stringify(result, null, 2) : "Click 'Execute Query' to run query live on CognoDB."}
        </pre>
      </div>
    </div>
  );
}
