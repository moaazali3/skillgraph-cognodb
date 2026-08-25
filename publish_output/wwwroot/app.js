// SkillGraph Frontend Application Logic connecting to ASP.NET Core API
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State
  let graphNodes = [];
  let graphLinks = [];
  let activeCategory = 'All';
  let highlightedNodeIds = new Set();
  let selectedNode = null;
  let transform = { x: 0, y: 0, k: 1 };
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let draggedNode = null;

  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');

  const CATEGORY_COLORS = {
    Frontend: '#06b6d4',
    Backend: '#10b981',
    'AI & Data': '#a855f7',
    'DevOps & Cloud': '#f59e0b',
    'Graph & Data': '#ec4899',
    Role: '#eab308',
    Developer: '#38bdf8',
    Course: '#64748b',
    Project: '#94a3b8'
  };

  // Resize canvas to match wrapper
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 1. Fetch Health Status
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.connected) {
        document.getElementById('lblLatency').textContent = `Live (${data.latencyMs}ms)`;
        document.getElementById('statLatency').textContent = `${data.latencyMs}ms`;
        document.getElementById('lblStatusMsg').textContent = `Connected to CognoDB Cloud over Bolt protocol.`;
      }
    } catch (e) {
      console.warn('Health check warning:', e);
    }
  }
  checkHealth();

  // 2. Fetch Graph Data
  async function loadGraphData() {
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      graphNodes = (data.nodes || []).map((n, i) => {
        const angle = (i / (data.nodes.length || 1)) * 2 * Math.PI;
        const radius = 170 + (i % 3) * 60;
        return {
          ...n,
          x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
          y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
          vx: 0,
          vy: 0
        };
      });

      graphLinks = data.links || [];
      document.getElementById('statSkills').textContent = graphNodes.filter(n => n.type === 'Skill').length;
    } catch (e) {
      console.error('Failed to load graph data:', e);
    }
  }
  loadGraphData();

  // 3. Canvas Simulation & Render Loop
  function simulateAndRender() {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;

    // Physics
    for (let i = 0; i < graphNodes.length; i++) {
      const a = graphNodes[i];
      if (a === draggedNode) continue;

      a.vx = (a.vx || 0) + (centerX - a.x) * 0.0005;
      a.vy = (a.vy || 0) + (centerY - a.y) * 0.0005;

      for (let j = i + 1; j < graphNodes.length; j++) {
        const b = graphNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < 260) {
          const force = (260 - dist) / dist * 0.4;
          const fx = dx * force;
          const fy = dy * force;
          if (a !== draggedNode) { a.vx -= fx; a.vy -= fy; }
          if (b !== draggedNode) { b.vx += fx; b.vy += fy; }
        }
      }
    }

    const nodeMap = new Map(graphNodes.map(n => [n.id, n]));
    for (const link of graphLinks) {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (src && tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 90) * 0.02;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (src !== draggedNode) { src.vx += fx; src.vy += fy; }
        if (tgt !== draggedNode) { tgt.vx -= fx; tgt.vy -= fy; }
      }
    }

    // Update coordinates
    for (const n of graphNodes) {
      if (n === draggedNode) continue;
      n.vx = (n.vx || 0) * 0.85;
      n.vy = (n.vy || 0) * 0.85;
      n.x += n.vx;
      n.y += n.vy;
    }

    // Render
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // Links
    for (const link of graphLinks) {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) continue;

      const isPath = highlightedNodeIds.has(src.id) && highlightedNodeIds.has(tgt.id);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isPath) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Nodes
    for (const node of graphNodes) {
      const isVisible = activeCategory === 'All' || node.category === activeCategory || node.type === activeCategory;
      const isPath = highlightedNodeIds.has(node.id);
      const isSelected = selectedNode?.id === node.id;

      ctx.globalAlpha = isVisible ? 1 : 0.2;

      const radius = (node.val || 12) * (isPath || isSelected ? 1.3 : 1);
      const color = CATEGORY_COLORS[node.category || node.type] || '#6366f1';

      if (isPath || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = isPath ? 'rgba(56, 189, 248, 0.35)' : 'rgba(99, 102, 241, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = isPath || isSelected ? '#ffffff' : '#cbd5e1';
      ctx.font = `${isPath || isSelected ? 'bold 12px' : '10px'} Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + radius + 4);

      ctx.globalAlpha = 1;
    }

    ctx.restore();
    requestAnimationFrame(simulateAndRender);
  }
  requestAnimationFrame(simulateAndRender);

  // 4. Canvas Events (Pan, Zoom, Drag)
  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - transform.x) / transform.k;
    const worldY = (mouseY - transform.y) / transform.k;
    return { worldX, worldY, mouseX, mouseY };
  }

  function findNode(wx, wy) {
    for (let i = graphNodes.length - 1; i >= 0; i--) {
      const n = graphNodes[i];
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (dx * dx + dy * dy <= ((n.val || 12) + 5) ** 2) return n;
    }
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    const { worldX, worldY, mouseX, mouseY } = getCoords(e);
    const hit = findNode(worldX, worldY);
    if (hit) {
      draggedNode = hit;
      selectedNode = hit;
    } else {
      isDragging = true;
      dragStart = { x: mouseX - transform.x, y: mouseY - transform.y };
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const { worldX, worldY, mouseX, mouseY } = getCoords(e);
    if (draggedNode) {
      draggedNode.x = worldX;
      draggedNode.y = worldY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (isDragging) {
      transform.x = mouseX - dragStart.x;
      transform.y = mouseY - dragStart.y;
    }
  });

  canvas.addEventListener('mouseup', () => {
    draggedNode = null;
    isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const { mouseX, mouseY } = getCoords(e);
    const newK = Math.min(Math.max(transform.k * factor, 0.3), 3);
    transform.x = mouseX - (mouseX - transform.x) * (newK / transform.k);
    transform.y = mouseY - (mouseY - transform.y) * (newK / transform.k);
    transform.k = newK;
  });

  document.getElementById('btnZoomIn').addEventListener('click', () => { transform.k = Math.min(transform.k * 1.2, 3); });
  document.getElementById('btnZoomOut').addEventListener('click', () => { transform.k = Math.max(transform.k * 0.8, 0.3); });
  document.getElementById('btnResetView').addEventListener('click', () => { transform = { x: 0, y: 0, k: 1 }; });

  // Category buttons
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
    });
  });

  // Highlight RAG Path
  document.getElementById('btnHighlightRag').addEventListener('click', () => {
    highlightedNodeIds = new Set(['python', 'math-stats', 'pandas-numpy', 'pytorch', 'transformers', 'rag-arch']);
  });

  // Tabs switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).style.display = 'block';

      if (btn.dataset.tab === 'analyzerTab') loadSkillGap();
      if (btn.dataset.tab === 'rolesTab') loadRolesCatalog();
      if (btn.dataset.tab === 'cypherTab') updateCypherQueryView();
    });
  });

  // Skill Gap logic
  async function loadSkillGap() {
    const devId = document.getElementById('selCandidate').value;
    const roleId = document.getElementById('selTargetRole').value;

    const res = await fetch(`/api/skill-gap?dev=${devId}&role=${roleId}`);
    const data = await res.json();
    const items = data.analysis || [];

    const missingContainer = document.getElementById('missingSkillsList');
    const acquiredContainer = document.getElementById('acquiredSkillsList');

    const missing = items.filter(i => !i.isAcquired);
    const acquired = items.filter(i => i.isAcquired);

    missingContainer.innerHTML = missing.map(m => `
      <div class="interactive-card" style="padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #ffffff; font-size: 13px;">${m.skillName}</strong>
          <span style="font-size: 10px; color: #fbbf24; background: rgba(245,158,11,0.2); padding: 2px 6px; border-radius: 4px;">Level: ${m.requiredLevel}</span>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${m.description}</p>
        <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; color: #34d399;">
          <span>${m.readinessBonus > 0 ? `✓ ${m.readinessBonus} Prerequisites Ready` : 'Base Requirement'}</span>
          <span style="color: #38bdf8;">Demand: ${m.marketDemand}%</span>
        </div>
      </div>
    `).join('');

    acquiredContainer.innerHTML = acquired.map(a => `
      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="color: #ffffff; font-size: 13px;">${a.skillName}</strong>
          <span style="display: block; font-size: 11px; color: var(--text-muted);">${a.category}</span>
        </div>
        <span style="font-size: 10px; color: #34d399; font-weight: bold; text-transform: uppercase;">${a.currentLevel || 'Verified'}</span>
      </div>
    `).join('');
  }

  document.getElementById('selCandidate').addEventListener('change', loadSkillGap);
  document.getElementById('selTargetRole').addEventListener('change', loadSkillGap);

  // Roles Catalog logic
  function loadRolesCatalog() {
    const roles = [
      { id: 'senior-fullstack', title: 'Senior Full-Stack Engineer (.NET/React)', salary: '$140k - $185k', desc: 'Builds enterprise scalable web systems across ASP.NET Core, React, SQL and Graph databases.' },
      { id: 'ai-systems-engineer', title: 'AI / LLM Systems Engineer', salary: '$165k - $225k', desc: 'Designs enterprise RAG pipelines, fine-tunes open-source LLMs, and deploys vector search engines.' },
      { id: 'cloud-devops-architect', title: 'Cloud & Platform Architect', salary: '$160k - $210k', desc: 'Architects multi-region Kubernetes clusters, IaC pipelines with Terraform, and resilient cloud networks.' }
    ];

    document.getElementById('rolesGrid').innerHTML = roles.map(r => `
      <div class="interactive-card">
        <span class="badge badge-dotnet">Career Path</span>
        <h4 style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 8px;">${r.title}</h4>
        <p style="font-size: 12px; color: var(--text-secondary); margin: 8px 0;">${r.desc}</p>
        <div style="font-size: 14px; font-weight: 800; color: #34d399;">${r.salary}</div>
      </div>
    `).join('');
  }

  // openCypher Queries runner
  const QUERIES = {
    path: `MATCH path = (prereq:Skill)-[:PREREQUISITE_FOR*1..5]->(target:Skill {id: 'rag-arch'})
RETURN [n IN nodes(path) | n.name] AS pathChain, length(path) AS hops ORDER BY hops DESC`,
    gap: `MATCH (d:Developer {id: 'dev-sarah'}) MATCH (r:Role {id: 'ai-systems-engineer'})-[:REQUIRES_SKILL]->(s:Skill)
RETURN s.name AS neededSkill, NOT (d)-[:PROFICIENT_IN]->(s) AS isMissing`,
    roi: `MATCH (d:Developer {id: 'dev-alex'}) MATCH (s:Skill) WHERE NOT (d)-[:PROFICIENT_IN]->(s)
MATCH (r:Role)-[:REQUIRES_SKILL]->(s) RETURN s.name, count(DISTINCT r) AS unlockedRolesCount ORDER BY unlockedRolesCount DESC LIMIT 5`
  };

  function updateCypherQueryView() {
    const qKey = document.getElementById('selPresetQuery').value;
    document.getElementById('cypherCodeView').textContent = QUERIES[qKey] || '';
  }

  document.getElementById('selPresetQuery').addEventListener('change', updateCypherQueryView);

  document.getElementById('btnExecuteCypher').addEventListener('click', async () => {
    const qKey = document.getElementById('selPresetQuery').value;
    let url = '/api/path?target=rag-arch';
    if (qKey === 'gap') url = '/api/skill-gap?dev=dev-sarah&role=ai-systems-engineer';
    if (qKey === 'roi') url = '/api/skill-gap/roi?dev=dev-alex';

    const start = performance.now();
    const res = await fetch(url);
    const data = await res.json();
    const elapsed = Math.round(performance.now() - start);

    document.getElementById('lblQueryLatency').textContent = `Execution Time: ${elapsed}ms`;
    document.getElementById('cypherResultOutput').textContent = JSON.stringify(data, null, 2);
  });

  // Modal logic
  const modal = document.getElementById('pathModal');
  document.getElementById('btnOpenPathFinder').addEventListener('click', () => { modal.style.display = 'flex'; });
  document.getElementById('btnCloseModal').addEventListener('click', () => { modal.style.display = 'none'; });

  document.getElementById('btnFindPath').addEventListener('click', async () => {
    const target = document.getElementById('selModalTarget').value;
    const res = await fetch(`/api/path?target=${target}`);
    const data = await res.json();
    const paths = data.paths || [];

    const container = document.getElementById('modalPathResults');
    if (paths.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">No incoming prerequisite dependencies found (foundational skill).</div>`;
      return;
    }

    container.innerHTML = paths.map((p, idx) => `
      <div class="interactive-card" style="padding: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">
          <span>Dependency Chain #${idx + 1} (${p.hops} Hops)</span>
          <button class="btn-secondary" style="font-size: 10px; padding: 2px 8px;" onclick="window.illuminatePath(${JSON.stringify(p.pathNodes.map(n => n.id))})">Highlight on Canvas</button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
          ${p.pathNodes.map((n, i) => `
            <span style="background: rgba(30, 41, 59, 0.9); padding: 4px 8px; border-radius: 6px; font-size: 11px; color: #ffffff; border: 1px solid rgba(255,255,255,0.1);">
              ${n.name}
            </span>
            ${i < p.pathNodes.length - 1 ? '<span style="color: #6366f1; font-weight: bold;">➔</span>' : ''}
          `).join('')}
        </div>
      </div>
    `).join('');
  });

  window.illuminatePath = function(ids) {
    highlightedNodeIds = new Set(ids);
    modal.style.display = 'none';
    document.querySelector('[data-tab="graphTab"]').click();
  };

  // Re-seed button
  document.getElementById('btnSeedDb').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to re-seed CognoDB?')) return;
    try {
      const btn = document.getElementById('btnSeedDb');
      btn.textContent = 'Seeding...';
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Database seeded successfully!');
      loadGraphData();
    } catch (e) {
      alert('Seeding failed: ' + e.message);
    } finally {
      document.getElementById('btnSeedDb').textContent = 'Re-Seed CognoDB';
    }
  });
});
