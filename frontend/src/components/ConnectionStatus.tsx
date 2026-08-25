import React, { useState, useEffect } from 'react';
import { Database, Terminal, RefreshCw } from 'lucide-react';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<{ connected: boolean; message: string; latencyMs?: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const check = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: status?.connected ? '#10b981' : '#f59e0b', boxShadow: status?.connected ? '0 0 10px #10b981' : 'none' }} />
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong style={{ color: '#ffffff', fontSize: 13 }}>CognoDB Managed Graph Engine</strong>
            <span className="badge badge-dotnet">ASP.NET Core C# API</span>
            <span className="badge badge-live">{status?.connected ? `Live (${status.latencyMs}ms)` : 'Connecting...'}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {status?.message || 'Connecting to ASP.NET Core backend...'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="http://localhost:5103/swagger" target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
          <Terminal style={{ width: 14, height: 14 }} />
          <span>Swagger Docs</span>
        </a>
        <button onClick={check} disabled={loading} className="btn-secondary" style={{ fontSize: 12, padding: '6px 10px' }}>
          <RefreshCw style={{ width: 14, height: 14 }} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
