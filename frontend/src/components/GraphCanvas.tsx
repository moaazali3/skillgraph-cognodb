import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, ArrowRight, EyeOff, Layers, CheckCircle2 } from 'lucide-react';

export interface InputNode {
  id: string;
  label: string;
  type: string;
  category?: string;
  difficulty?: string;
  marketDemand?: number;
  description?: string;
  domain?: string;
  avgSalary?: string;
  seniorityLevel?: string;
  val: number;
  x?: number;
  y?: number;
}

export interface Node extends InputNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tier: number;
}

export interface Link {
  source: string;
  target: string;
  type: string;
  importance?: string;
}

interface GraphCanvasProps {
  nodes: InputNode[];
  links: Link[];
  highlightedPathNodeIds?: string[];
  onSelectNode?: (node: Node | null) => void;
  onTracePathTo?: (targetSkillId: string) => void;
  onClearHighlights?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: '#06b6d4',
  Backend: '#10b981',
  'AI & Data': '#a855f7',
  'DevOps & Cloud': '#f59e0b',
  'Graph & Data': '#ec4899',
  Role: '#eab308'
};

const SKILL_TIERS: Record<string, number> = {
  'html-css': 0,
  'python': 0,
  'linux-shell': 0,
  'sql-db': 0,
  'javascript': 0,

  'typescript': 1,
  'react': 1,
  'csharp-dotnet': 1,
  'fastapi': 1,
  'nodejs': 1,
  'go': 1,
  'math-stats': 1,
  'pandas-numpy': 1,
  'docker': 1,
  'graph-theory': 1,

  'nextjs': 2,
  'state-mgmt': 2,
  'redis-cache': 2,
  'grpc-proto': 2,
  'rust': 2,
  'pytorch': 2,
  'kubernetes': 2,
  'cicd-pipelines': 2,
  'opencypher-neo4j': 2,

  'web-perf': 3,
  'dist-sys': 3,
  'transformers': 3,
  'vector-dbs': 3,
  'rag-arch': 3,
  'llm-finetuning': 3,
  'terraform': 3,
  'cloud-aws': 3,
  'cognodb-cloud': 3,
  'gnn-models': 3,

  'senior-fullstack': 4,
  'ai-systems-engineer': 4,
  'cloud-devops-architect': 4,
  'systems-dist-engineer': 4,
  'graph-knowledge-engineer': 4
};

const ROLE_CATEGORIES: Record<string, string[]> = {
  'senior-fullstack': ['Frontend', 'Backend'],
  'systems-dist-engineer': ['Backend'],
  'ai-systems-engineer': ['AI & Data'],
  'cloud-devops-architect': ['DevOps & Cloud'],
  'graph-knowledge-engineer': ['Graph & Data', 'AI & Data']
};

export default function GraphCanvas({
  nodes: initialNodes,
  links: initialLinks,
  highlightedPathNodeIds = [],
  onSelectNode,
  onTracePathTo,
  onClearHighlights
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const transformRef = useRef({ x: 40, y: 30, k: 0.95 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const simulationNodesRef = useRef<Node[]>([]);
  const simulationLinksRef = useRef<Link[]>([]);
  const animFrameRef = useRef<number>(0);

  // Initialize Structured Left-to-Right Hierarchical Layout
  useEffect(() => {
    const cleanNodes = initialNodes.filter(n => n.type === 'Skill' || n.type === 'Role');
    const cleanNodeIds = new Set(cleanNodes.map(n => n.id));
    const cleanLinks = initialLinks.filter(l => cleanNodeIds.has(l.source) && cleanNodeIds.has(l.target));

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 560;

    const tierGroups: Record<number, InputNode[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    cleanNodes.forEach(n => {
      const tier = SKILL_TIERS[n.id] ?? (n.type === 'Role' ? 4 : 2);
      tierGroups[tier]?.push(n);
    });

    const positionedNodes: Node[] = [];
    const tierXPositions = [80, 260, 470, 690, 920];

    Object.entries(tierGroups).forEach(([tierStr, group]) => {
      const tier = parseInt(tierStr);
      const x = tierXPositions[tier] || 400;
      const count = group.length;

      group.forEach((node, idx) => {
        const spacing = Math.min(height / (count + 1), 60);
        const startY = (height - (count - 1) * spacing) / 2;
        const y = startY + idx * spacing;

        positionedNodes.push({
          ...node,
          x,
          y,
          vx: 0,
          vy: 0,
          tier
        });
      });
    });

    simulationNodesRef.current = positionedNodes;
    simulationLinksRef.current = cleanLinks.map(l => ({ ...l }));
  }, [initialNodes, initialLinks]);

  // Find active node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return simulationNodesRef.current.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, simulationNodesRef.current]);

  // Compute direct incoming prerequisites and outgoing unlocks
  const { incomingPrereqs, outgoingSkills, outgoingRoles, fullUpstreamIds } = useMemo(() => {
    if (!selectedNode) {
      return { incomingPrereqs: [], outgoingSkills: [], outgoingRoles: [], fullUpstreamIds: new Set<string>() };
    }

    const allNodes = simulationNodesRef.current;
    const allLinks = simulationLinksRef.current;
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));

    let inPrereqs: Node[] = [];
    let outSkills: Node[] = [];
    let outRoles: Node[] = [];

    if (selectedNode.type === 'Role') {
      // Role requires skills (links where source is roleId and target is skill)
      inPrereqs = allLinks
        .filter(l => l.source === selectedNode.id && (l.type === 'REQUIRES_SKILL' || nodeMap.get(l.target)?.type === 'Skill'))
        .map(l => nodeMap.get(l.target))
        .filter(Boolean) as Node[];
    } else {
      // Skill needs prerequisites (links where target is skillId and type is PREREQUISITE_FOR)
      inPrereqs = allLinks
        .filter(l => l.target === selectedNode.id && l.type === 'PREREQUISITE_FOR')
        .map(l => nodeMap.get(l.source))
        .filter(Boolean) as Node[];

      // Skill unlocks downstream skills
      outSkills = allLinks
        .filter(l => l.source === selectedNode.id && l.type === 'PREREQUISITE_FOR')
        .map(l => nodeMap.get(l.target))
        .filter(Boolean) as Node[];

      // Skill is required by Roles
      outRoles = allLinks
        .filter(l => l.target === selectedNode.id && (l.type === 'REQUIRES_SKILL' || nodeMap.get(l.source)?.type === 'Role'))
        .map(l => nodeMap.get(l.source))
        .filter(Boolean) as Node[];
    }

    // Compute complete upstream recursive tree for path highlighting
    const upstreamIds = new Set<string>([selectedNode.id]);
    const queue = [selectedNode.id];

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currNode = nodeMap.get(currId);
      if (!currNode) continue;

      if (currNode.type === 'Role') {
        const directReqs = allLinks
          .filter(l => l.source === currId && (l.type === 'REQUIRES_SKILL' || nodeMap.get(l.target)?.type === 'Skill'))
          .map(l => l.target);
        for (const sId of directReqs) {
          if (!upstreamIds.has(sId)) {
            upstreamIds.add(sId);
            queue.push(sId);
          }
        }
      } else {
        const directPrereqs = allLinks
          .filter(l => l.target === currId && l.type === 'PREREQUISITE_FOR')
          .map(l => l.source);
        for (const pId of directPrereqs) {
          if (!upstreamIds.has(pId)) {
            upstreamIds.add(pId);
            queue.push(pId);
          }
        }
      }
    }

    return {
      incomingPrereqs: inPrereqs,
      outgoingSkills: outSkills,
      outgoingRoles: outRoles,
      fullUpstreamIds: upstreamIds
    };
  }, [selectedNode, simulationNodesRef.current, simulationLinksRef.current]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      const nodes = simulationNodesRef.current;
      const links = simulationLinksRef.current;
      const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

      // Active path calculation: either explicit highlightedPathNodeIds or selected node's upstream path
      const pathSet = new Set<string>();
      if (highlightedPathNodeIds.length > 0) {
        highlightedPathNodeIds.forEach(id => pathSet.add(id));
      } else if (selectedNode) {
        fullUpstreamIds.forEach(id => pathSet.add(id));
      }

      const hasActivePath = pathSet.size > 0;

      // Draw Roadmap Tier Background Columns
      const tierNames = ['1. FOUNDATION', '2. CORE STACK', '3. ADVANCED', '4. SPECIALIZED', '5. TARGET ROLES'];
      const tierXPositions = [80, 260, 470, 690, 920];

      tierXPositions.forEach((x, i) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(x - 65, 0, 130, height);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tierNames[i], x, 25);
      });

      // 1. Draw Links with Directional Arrows (➔)
      for (const link of links) {
        let s = nodeMap.get(link.source);
        let tg = nodeMap.get(link.target);
        if (!s || !tg) continue;

        // If link connects a role to a skill (REQUIRES_SKILL), orient Skill (Left) -> Role (Right) visually
        let isRoleLink = false;
        if (s.type === 'Role' && tg.type === 'Skill') {
          const temp = s;
          s = tg;
          tg = temp;
          isRoleLink = true;
        }

        const isLinkInActivePath = pathSet.has(s.id) && pathSet.has(tg.id);
        const isSelectedLink = selectedNode && (s.id === selectedNode.id || tg.id === selectedNode.id);
        
        // Category filtering
        const sRoleCats = ROLE_CATEGORIES[s.id] || [];
        const tgRoleCats = ROLE_CATEGORIES[tg.id] || [];
        const sMatchesCat = activeCategory === 'All' || s.category === activeCategory || s.type === activeCategory || sRoleCats.includes(activeCategory);
        const tgMatchesCat = activeCategory === 'All' || tg.category === activeCategory || tg.type === activeCategory || tg.type === 'Role' || tgRoleCats.includes(activeCategory);
        const isCategoryLink = activeCategory !== 'All' && (sMatchesCat && tgMatchesCat);
        const catColor = CATEGORY_COLORS[activeCategory] || '#6366f1';

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        const cp1x = s.x + (tg.x - s.x) * 0.5;
        const cp1y = s.y;
        const cp2x = s.x + (tg.x - s.x) * 0.5;
        const cp2y = tg.y;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tg.x, tg.y);

        if (isLinkInActivePath || isSelectedLink) {
          ctx.strokeStyle = isSelectedLink ? '#a855f7' : '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = isSelectedLink ? '#a855f7' : '#38bdf8';
          ctx.shadowBlur = 12;
        } else if (isCategoryLink) {
          ctx.strokeStyle = catColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = catColor;
          ctx.shadowBlur = 10;
        } else if (hasActivePath || activeCategory !== 'All') {
          // Dimmed background link
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        } else {
          // Default clean link
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw directional arrowhead on the target
        const shouldDrawArrow = isLinkInActivePath || isSelectedLink || isCategoryLink || (!hasActivePath && activeCategory === 'All');
        if (shouldDrawArrow) {
          const arrowAngle = Math.atan2(tg.y - cp2y, tg.x - cp2x);
          const arrowSize = (isLinkInActivePath || isSelectedLink || isCategoryLink) ? 7 : 4;
          const arrowX = tg.x - (tg.type === 'Role' ? 17 : 13) * Math.cos(arrowAngle);
          const arrowY = tg.y - (tg.type === 'Role' ? 17 : 13) * Math.sin(arrowAngle);

          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - arrowSize * Math.cos(arrowAngle - Math.PI / 6), arrowY - arrowSize * Math.sin(arrowAngle - Math.PI / 6));
          ctx.lineTo(arrowX - arrowSize * Math.cos(arrowAngle + Math.PI / 6), arrowY - arrowSize * Math.sin(arrowAngle + Math.PI / 6));
          
          if (isSelectedLink) {
            ctx.fillStyle = '#a855f7';
          } else if (isLinkInActivePath) {
            ctx.fillStyle = '#38bdf8';
          } else if (isCategoryLink) {
            ctx.fillStyle = catColor;
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          }
          ctx.fill();
        }
      }

      // 2. Draw Nodes
      for (const n of nodes) {
        const isPath = pathSet.has(n.id);
        const roleCats = ROLE_CATEGORIES[n.id] || [];
        const matchesCategory = hasActivePath 
          ? isPath 
          : (activeCategory === 'All' || 
             n.category === activeCategory || 
             n.type === activeCategory ||
             (n.type === 'Role' && roleCats.includes(activeCategory)));
        const isSelected = selectedNode?.id === n.id;

        ctx.globalAlpha = matchesCategory || isSelected ? 1 : 0.12;

        const radius = n.type === 'Role' ? 14 : 10;
        const color = CATEGORY_COLORS[n.category || n.type] || '#6366f1';

        // Luminous Glow on Selected or Path Nodes
        if (isSelected || isPath) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + (isSelected ? 8 : 5), 0, Math.PI * 2);
          ctx.fillStyle = isSelected 
            ? 'rgba(168, 85, 247, 0.45)' 
            : 'rgba(56, 189, 248, 0.35)';
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : (isPath ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)');
        ctx.lineWidth = isSelected ? 3 : (isPath ? 2 : 1.2);
        ctx.stroke();

        // Label
        ctx.fillStyle = isSelected ? '#ffffff' : (isPath ? '#e0f2fe' : '#cbd5e1');
        ctx.font = `${isSelected || isPath ? 'bold 11px' : '10px'} Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(n.label, n.x, n.y + radius + 4);

        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeCategory, highlightedPathNodeIds, selectedNode, fullUpstreamIds]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { worldX: 0, worldY: 0, mouseX: 0, mouseY: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const t = transformRef.current;
    return { worldX: (mouseX - t.x) / t.k, worldY: (mouseY - t.y) / t.k, mouseX, mouseY };
  };

  const findNodeAt = (wx: number, wy: number) => {
    const nodes = simulationNodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (dx * dx + dy * dy <= ((n.val || 12) + 8) ** 2) return n;
    }
    return null;
  };

  const selectNodeDirectly = (node: Node | null) => {
    // Clear external highlight to ensure newly clicked node is isolated and accurate
    if (highlightedPathNodeIds.length > 0) {
      onClearHighlights?.();
    }
    setSelectedNodeId(node ? node.id : null);
    onSelectNode?.(node);
  };

  const handleCategoryClick = (cat: string) => {
    onClearHighlights?.();
    setSelectedNodeId(null);
    onSelectNode?.(null);
    setActiveCategory(cat);
  };

  return (
    <div className={`graph-layout-container ${selectedNode ? 'has-selection' : ''}`}>
      {/* Canvas Area */}
      <div ref={containerRef} className="glass-panel canvas-wrapper">
        {/* Top Filter Bar */}
        <div className="top-bar-wrapper">
          <div className="glass-panel filter-bar-scrollable">
            {['All', 'Frontend', 'Backend', 'AI & Data', 'DevOps & Cloud', 'Graph & Data', 'Role'].map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`btn-filter ${activeCategory === cat && highlightedPathNodeIds.length === 0 && !selectedNode ? 'active' : ''}`}
                style={{ flexShrink: 0 }}
              >
                {cat === 'Role' ? 'Careers/Roles' : cat}
              </button>
            ))}
            {(highlightedPathNodeIds.length > 0 || selectedNode) && (
              <button
                onClick={() => {
                  onClearHighlights?.();
                  setSelectedNodeId(null);
                  onSelectNode?.(null);
                  setActiveCategory('All');
                }}
                className="btn-secondary"
                style={{ fontSize: 11, padding: '4px 10px', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)', flexShrink: 0 }}
              >
                <EyeOff style={{ width: 12, height: 12 }} />
                <span>Reset View</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto', flexShrink: 0 }}>
            <button onClick={() => { transformRef.current.k = Math.min(transformRef.current.k * 1.15, 2.5); }} className="btn-secondary" style={{ padding: '6px 10px' }} title="Zoom In">
              <ZoomIn style={{ width: 14, height: 14 }} />
            </button>
            <button onClick={() => { transformRef.current.k = Math.max(transformRef.current.k * 0.85, 0.4); }} className="btn-secondary" style={{ padding: '6px 10px' }} title="Zoom Out">
              <ZoomOut style={{ width: 14, height: 14 }} />
            </button>
            <button onClick={() => { transformRef.current = { x: 40, y: 30, k: 0.95 }; }} className="btn-secondary" style={{ padding: '6px 10px' }} title="Reset Position">
              <RotateCcw style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={e => {
            const { worldX, worldY, mouseX, mouseY } = getCanvasCoords(e);
            const hit = findNodeAt(worldX, worldY);
            if (hit) {
              selectNodeDirectly(hit);
            } else {
              isDraggingRef.current = true;
              dragStartRef.current = { x: mouseX - transformRef.current.x, y: mouseY - transformRef.current.y };
            }
          }}
          onPointerMove={e => {
            const { mouseX, mouseY } = getCanvasCoords(e);
            if (isDraggingRef.current) {
              transformRef.current.x = mouseX - dragStartRef.current.x;
              transformRef.current.y = mouseY - dragStartRef.current.y;
            }
          }}
          onPointerUp={() => {
            isDraggingRef.current = false;
          }}
          onPointerCancel={() => {
            isDraggingRef.current = false;
          }}
          onWheel={e => {
            if (e.ctrlKey) {
              e.preventDefault();
              const factor = e.deltaY < 0 ? 1.1 : 0.9;
              const { mouseX, mouseY } = getCanvasCoords(e);
              const newK = Math.min(Math.max(transformRef.current.k * factor, 0.4), 2.5);
              transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newK / transformRef.current.k);
              transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newK / transformRef.current.k);
              transformRef.current.k = newK;
            }
          }}
          style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
        />
      </div>

      {/* Side Details Inspector on Node Click */}
      {selectedNode && (
        <div className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: '#090e1a', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge" style={{ backgroundColor: `${CATEGORY_COLORS[selectedNode.category || selectedNode.type]}25`, color: CATEGORY_COLORS[selectedNode.category || selectedNode.type], border: `1px solid ${CATEGORY_COLORS[selectedNode.category || selectedNode.type]}50` }}>
              {selectedNode.type === 'Role' ? 'TARGET CAREER ROLE' : (selectedNode.category || selectedNode.type)}
            </span>
            <button onClick={() => selectNodeDirectly(null)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: 4 }}>✕</button>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{selectedNode.label}</h3>
            {selectedNode.domain && (
              <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600, display: 'block', marginTop: 2 }}>{selectedNode.domain}</span>
            )}
            {selectedNode.description && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{selectedNode.description}</p>
            )}
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
            {selectedNode.marketDemand && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Market Demand: <strong style={{ color: '#34d399' }}>{selectedNode.marketDemand}%</strong>
              </div>
            )}
            {selectedNode.difficulty && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Difficulty: <strong style={{ color: '#fbbf24' }}>{selectedNode.difficulty}</strong>
              </div>
            )}
            {selectedNode.avgSalary && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Avg Salary: <strong style={{ color: '#34d399' }}>{selectedNode.avgSalary}</strong>
              </div>
            )}
            {selectedNode.seniorityLevel && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Level: <strong style={{ color: '#a855f7' }}>{selectedNode.seniorityLevel}</strong>
              </div>
            )}
          </div>

          {/* Prerequisites / Required Skills */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              ⬅ {selectedNode.type === 'Role' ? 'Required Skills for this Role:' : 'Prerequisites Needed Before:'}
            </span>
            {incomingPrereqs.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Foundation skill (no prerequisites)</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {incomingPrereqs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectNodeDirectly(p)}
                    style={{ background: 'rgba(30,41,59,0.8)', color: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    title={`Click to inspect ${p.label}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unlocks Next (For Skills) */}
          {selectedNode.type === 'Skill' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', display: 'block', marginBottom: 8 }}>
                ➡ Technologies This Unlocks Next:
              </span>
              {outgoingSkills.length === 0 ? (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Specialized / Terminal Skill</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {outgoingSkills.map(o => (
                    <button
                      key={o.id}
                      onClick={() => selectNodeDirectly(o)}
                      style={{ background: 'rgba(30,41,59,0.8)', color: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left' }}
                      title={`Click to inspect ${o.label}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Career Roles Requiring this Skill */}
          {selectedNode.type === 'Skill' && outgoingRoles.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308', display: 'block', marginBottom: 8 }}>
                🎯 Target Roles Requiring This Skill:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {outgoingRoles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => selectNodeDirectly(r)}
                    style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#fef08a', padding: '4px 8px', borderRadius: 6, fontSize: 10, border: '1px solid rgba(234, 179, 8, 0.3)', cursor: 'pointer', textAlign: 'left' }}
                    title={`Click to inspect role ${r.label}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={() => onTracePathTo?.(selectedNode.id)}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: 11, padding: '8px 12px' }}
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            <span>Open Path Finder for this {selectedNode.type}</span>
          </button>
        </div>
      )}
    </div>
  );
}
