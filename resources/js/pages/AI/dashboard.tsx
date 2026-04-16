import { useState, useMemo, useEffect } from 'react';
import {
    Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw,
    Target, CheckSquare, Clock, Sparkles, Calendar, BarChart3,
    Zap, Search, X, ChevronDown, ChevronUp, Filter,
    SlidersHorizontal, ArrowUpDown, CheckCircle2, Circle, Flag,
    ArrowLeft, LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { CustomPageHeader } from '@/components/custom-page-header';

/* ─────────────────────────────────────────────────────────────
   Keyframes
   ───────────────────────────────────────────────────────────── */
const KF = `
@keyframes dashFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes dashScaleIn { from{opacity:0;transform:scale(0.97)}      to{opacity:1;transform:scale(1)}      }
@keyframes spinSlow    { from{transform:rotate(0deg)}               to{transform:rotate(360deg)}          }
@keyframes collapseOpen{ from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
@keyframes barFill     { from{width:0%} to{width:var(--bar-w)}                                            }
`;
if (typeof document !== 'undefined' && !document.getElementById('ai-dash-kf')) {
    const s = document.createElement('style'); s.id = 'ai-dash-kf'; s.textContent = KF;
    document.head.appendChild(s);
}

const fadeUp  = (d = 0): React.CSSProperties => ({ animation: `dashFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both`,  animationDelay: `${d}ms` });
const scaleIn = (d = 0): React.CSSProperties => ({ animation: `dashScaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${d}ms` });

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */
interface Insight {
    id?: number;
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    analyzed_at?: string;
    metadata?: Record<string, unknown>;
}

interface AIDashboardProps {
    goalInsights:  Insight[];
    taskInsights:  Insight[];
    anomalies:     Insight[];
    latestSummary: string;
    lastAnalyzed:  string;
}

type ImpactFilter = 'all' | 'high' | 'medium' | 'low';
type SortKey      = 'default' | 'impact_asc' | 'impact_desc' | 'date_desc' | 'date_asc';

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const PAGE_SIZE = 20;

/* ─────────────────────────────────────────────────────────────
   Impact helpers — mapped to CSAV design tokens
   high   → accent   (#eb3d00)
   medium → secondary (#fdfa00)
   low    → primary  (#004f39)
   ───────────────────────────────────────────────────────────── */
const impactCard = (i: string) => ({
    high:   'bg-accent/5 border-accent/20 text-accent',
    medium: 'bg-secondary/30 border-secondary/50 text-secondary-foreground',
    low:    'bg-primary/5 border-primary/20 text-primary',
}[i] ?? 'bg-muted border-border text-muted-foreground');

const impactBadge = (i: string) => ({
    high:   'bg-accent/10 text-accent border-accent/30',
    medium: 'bg-secondary text-secondary-foreground border-secondary/50',
    low:    'bg-primary/10 text-primary border-primary/20',
}[i] ?? 'bg-muted text-muted-foreground border-border');

const ImpactIcon = ({ impact, cls = 'h-3.5 w-3.5' }: { impact: string; cls?: string }) => (
    impact === 'high'   ? <AlertTriangle className={cls} /> :
    impact === 'medium' ? <Clock className={cls} /> :
    <Zap className={cls} />
);

/* ─────────────────────────────────────────────────────────────
   useInsightFilter hook
   ───────────────────────────────────────────────────────────── */
function useInsightFilter(items: Insight[]) {
    const [search,      setSearch]      = useState('');
    const [impact,      setImpact]      = useState<ImpactFilter>('all');
    const [actionable,  setActionable]  = useState(false);
    const [sort,        setSort]        = useState<SortKey>('default');
    const [page,        setPage]        = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { setPage(1); }, [search, impact, actionable, sort]);

    const filtered = useMemo(() => {
        let r = [...(items ?? [])];
        if (search)           r = r.filter(x => x.title.toLowerCase().includes(search.toLowerCase()) || x.description.toLowerCase().includes(search.toLowerCase()));
        if (impact !== 'all') r = r.filter(x => x.impact === impact);
        if (actionable)       r = r.filter(x => x.actionable);
        switch (sort) {
            case 'impact_asc':  r.sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]); break;
            case 'impact_desc': r.sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact]); break;
            case 'date_desc':   r.sort((a, b) => new Date(b.analyzed_at ?? 0).getTime() - new Date(a.analyzed_at ?? 0).getTime()); break;
            case 'date_asc':    r.sort((a, b) => new Date(a.analyzed_at ?? 0).getTime() - new Date(b.analyzed_at ?? 0).getTime()); break;
        }
        return r;
    }, [items, search, impact, actionable, sort]);

    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged        = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters   = search !== '' || impact !== 'all' || actionable;
    const clearFilters = () => { setSearch(''); setImpact('all'); setActionable(false); setSort('default'); };

    return { search, setSearch, impact, setImpact, actionable, setActionable,
             sort, setSort, page, setPage, totalPages, paged, filtered,
             showFilters, setShowFilters, hasFilters, clearFilters };
}

/* ─────────────────────────────────────────────────────────────
   Section card header — bg-primary replaces navy #1d4791
   ───────────────────────────────────────────────────────────── */
function CardHeader({ icon, title, count, action }: {
    icon: React.ReactNode; title: string; count?: number; action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-3 bg-primary rounded-t-xl">
            <div className="flex items-center gap-2 text-primary-foreground min-w-0">
                <span className="opacity-70 flex-shrink-0">{icon}</span>
                <span className="text-[10px] font-black tracking-widest uppercase truncate">{title}</span>
                {count !== undefined && count > 0 && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold">
                        {count.toLocaleString()}
                    </span>
                )}
            </div>
            {action && <div className="flex-shrink-0 ml-3">{action}</div>}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FilterToolbar
   ───────────────────────────────────────────────────────────── */
function FilterToolbar({ state, onGenerate, generating }: {
    state: ReturnType<typeof useInsightFilter>;
    onGenerate: () => void;
    generating: boolean;
}) {
    const { search, setSearch, impact, setImpact, actionable, setActionable,
            sort, setSort, showFilters, setShowFilters, hasFilters, clearFilters, filtered } = state;

    return (
        <div className="bg-muted/40 border-b border-border px-4 py-2.5 space-y-2.5">
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search insights…"
                        className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-border bg-card placeholder:text-muted-foreground
                                   focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary/50 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent">
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Filters toggle */}
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition-all flex-shrink-0 ${
                        showFilters || hasFilters
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                    }`}>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </button>

                {/* Refresh */}
                <button onClick={onGenerate} disabled={generating}
                    className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground
                               hover:text-primary hover:border-primary/40 transition-all disabled:opacity-50 flex-shrink-0">
                    <RefreshCw className="h-3.5 w-3.5" style={generating ? { animation: 'spinSlow 1s linear infinite' } : {}} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>

                {/* Clear */}
                {hasFilters && (
                    <button onClick={clearFilters}
                        className="h-8 px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors flex-shrink-0">
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Clear</span>
                    </button>
                )}
            </div>

            {/* Expanded filter row */}
            {showFilters && (
                <div style={{ animation: 'collapseOpen 0.2s ease both' }} className="flex flex-wrap items-center gap-2">
                    {/* Impact pills */}
                    <div className="flex items-center gap-1">
                        {(['all', 'high', 'medium', 'low'] as ImpactFilter[]).map(v => (
                            <button key={v} onClick={() => setImpact(v)}
                                className={`h-6 px-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                                    impact === v
                                        ? v === 'high'   ? 'bg-accent text-accent-foreground border-accent'
                                        : v === 'medium' ? 'bg-secondary text-secondary-foreground border-secondary'
                                        : v === 'low'    ? 'bg-primary text-primary-foreground border-primary'
                                        :                  'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                                }`}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="h-4 w-px bg-border" />

                    {/* Actionable toggle */}
                    <button onClick={() => setActionable(!actionable)}
                        className={`h-6 px-2.5 flex items-center gap-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                            actionable ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                        }`}>
                        {actionable ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        Actionable only
                    </button>

                    <div className="h-4 w-px bg-border" />

                    {/* Sort */}
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                            className="h-6 pl-2 pr-6 text-[11px] rounded-lg border border-border bg-card text-foreground
                                       focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer">
                            <option value="default">Default order</option>
                            <option value="impact_asc">Impact: High → Low</option>
                            <option value="impact_desc">Impact: Low → High</option>
                            <option value="date_desc">Newest first</option>
                            <option value="date_asc">Oldest first</option>
                        </select>
                    </div>

                    <span className="ml-auto text-[11px] text-muted-foreground font-medium">
                        {filtered.length.toLocaleString()} result{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   PaginationBar
   ───────────────────────────────────────────────────────────── */
function PaginationBar({ page, total, count, filteredCount, onChange }: {
    page: number; total: number; count: number; filteredCount: number; onChange: (p: number) => void;
}) {
    if (total <= 1 && filteredCount === count) return null;

    const pages: (number | '…')[] = [];
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
        if (page < total - 2) pages.push('…');
        pages.push(total);
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, filteredCount);

    return (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
            <span className="text-[11px] text-muted-foreground">
                Showing {from.toLocaleString()}–{to.toLocaleString()} of {filteredCount.toLocaleString()}
                {filteredCount < count && <span className="opacity-50"> (filtered from {count.toLocaleString()})</span>}
            </span>
            {total > 1 && (
                <div className="flex items-center gap-1">
                    <button onClick={() => onChange(page - 1)} disabled={page === 1}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground
                                   disabled:opacity-40 hover:border-primary/40 hover:text-primary transition-colors">
                        <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    {pages.map((p, i) =>
                        p === '…'
                            ? <span key={`e${i}`} className="h-7 w-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
                            : <button key={p} onClick={() => onChange(p as number)}
                                className={`h-7 min-w-[1.75rem] px-1 flex items-center justify-center rounded-lg text-xs font-black transition-all border ${
                                    p === page
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                                }`}>{p}</button>
                    )}
                    <button onClick={() => onChange(page + 1)} disabled={page === total}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground
                                   disabled:opacity-40 hover:border-primary/40 hover:text-primary transition-colors">
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   InsightCard
   ───────────────────────────────────────────────────────────── */
function InsightCard({ insight, collapsible = false }: { insight: Insight; collapsible?: boolean }) {
    const [expanded, setExpanded] = useState(!collapsible);

    return (
        <div className={`rounded-xl border px-4 py-3 transition-all duration-150 hover:shadow-sm hover:-translate-y-px ${impactCard(insight.impact)}`}>
            <div className="flex items-start gap-2.5">
                <ImpactIcon impact={insight.impact} cls="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-80" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                            <h3 className="font-bold text-foreground text-xs leading-snug">{insight.title}</h3>
                            {insight.actionable && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    <Sparkles className="h-2 w-2" /> Action
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`inline-flex items-center text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border ${impactBadge(insight.impact)}`}>
                                {insight.impact}
                            </span>
                            {collapsible && (
                                <button onClick={() => setExpanded(!expanded)}
                                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {expanded && (
                        <div style={collapsible ? { animation: 'collapseOpen 0.18s ease both' } : {}}>
                            <p className="text-muted-foreground text-xs leading-relaxed mt-1">{insight.description}</p>
                            {insight.analyzed_at && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                    Generated: {new Date(insight.analyzed_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   AnomalyCard — accent-colored
   ───────────────────────────────────────────────────────────── */
function AnomalyCard({ anomaly, collapsible = false }: { anomaly: Insight; collapsible?: boolean }) {
    const [expanded, setExpanded] = useState(!collapsible);

    return (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 transition-all duration-150 hover:shadow-sm hover:-translate-y-px">
            <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-xs leading-snug flex-1">{anomaly.title}</h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="inline-flex items-center text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border bg-accent/10 text-accent border-accent/30">
                                {anomaly.impact?.toUpperCase() || 'MED'}
                            </span>
                            {collapsible && (
                                <button onClick={() => setExpanded(!expanded)}
                                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {expanded && (
                        <div style={collapsible ? { animation: 'collapseOpen 0.18s ease both' } : {}}>
                            <p className="text-muted-foreground text-xs leading-relaxed mt-1">{anomaly.description}</p>
                            {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                    {Object.entries(anomaly.metadata).map(([k, v]) => (
                                        <span key={k} className="text-[10px] text-accent/80 font-semibold">{k}: {String(v)}</span>
                                    ))}
                                </div>
                            )}
                            {anomaly.analyzed_at && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                    Detected: {new Date(anomaly.analyzed_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────────────────────── */
function EmptyState({ type, onGenerate, isFiltered = false }: {
    type: string; onGenerate: () => void; isFiltered?: boolean;
}) {
    return (
        <div className="text-center py-10">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                {isFiltered
                    ? <Filter className="h-5 w-5 text-primary/40" />
                    : <Lightbulb className="h-5 w-5 text-primary/40" />}
            </div>
            <p className="text-muted-foreground text-xs mb-3">
                {isFiltered
                    ? 'No results match your filters.'
                    : `No ${type} insights yet. Generate insights to see recommendations.`}
            </p>
            {!isFiltered && (
                <button onClick={onGenerate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/15">
                    <Sparkles className="h-3 w-3" />
                    Generate Insights
                </button>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   StatCard — 60/30/10 accent bar on top
   ───────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, sub, delay = 0, accent = false }: {
    label: string; value: string | number; icon: React.ReactNode; sub?: string; delay?: number; accent?: boolean;
}) {
    return (
        <div style={fadeUp(delay)} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className={`h-1 ${accent ? 'bg-accent' : 'bg-primary'}`} />
            <div className="px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1">{label}</p>
                    <p className="text-3xl font-extrabold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ImpactBreakdownBar — CSAV colors
   ───────────────────────────────────────────────────────────── */
function ImpactBreakdownBar({ items, label }: { items: Insight[]; label: string }) {
    if (!items.length) return null;
    const high   = items.filter(x => x.impact === 'high').length;
    const medium = items.filter(x => x.impact === 'medium').length;
    const low    = items.filter(x => x.impact === 'low').length;
    const total  = items.length;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>{label}</span><span>{total.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex gap-px bg-border">
                {high   > 0 && <div className="bg-accent rounded-l-full"    style={{ width: `${(high/total)*100}%` }} />}
                {medium > 0 && <div className="bg-secondary"                style={{ width: `${(medium/total)*100}%` }} />}
                {low    > 0 && <div className="bg-primary rounded-r-full"   style={{ width: `${(low/total)*100}%` }} />}
            </div>
            <div className="flex gap-3 text-[10px] font-semibold">
                {high   > 0 && <span className="text-accent">{high} high</span>}
                {medium > 0 && <span className="text-secondary-foreground">{medium} med</span>}
                {low    > 0 && <span className="text-primary">{low} low</span>}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   OverviewPreviewCard
   ───────────────────────────────────────────────────────────── */
function OverviewPreviewCard({ items, title, icon, type, onGenerate, generating, onViewAll, isAnomaly = false, previewCount = 5 }: {
    items: Insight[]; title: string; icon: React.ReactNode;
    type: string; onGenerate: () => void; generating: boolean;
    onViewAll: () => void; isAnomaly?: boolean; previewCount?: number;
}) {
    const preview = useMemo(() =>
        [...(items ?? [])].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]).slice(0, previewCount),
        [items, previewCount]
    );
    const highCount   = items.filter(x => x.impact === 'high').length;
    const actionCount = items.filter(x => x.actionable).length;

    return (
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card flex flex-col">
            <CardHeader icon={icon} title={title} count={items.length}
                action={
                    <button onClick={onGenerate} disabled={generating}
                        className="h-6 w-6 flex items-center justify-center rounded text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/15 transition-colors disabled:opacity-40">
                        <RefreshCw className="h-3 w-3" style={generating ? { animation: 'spinSlow 1s linear infinite' } : {}} />
                    </button>
                }
            />
            {items.length > 0 && (
                <div className="px-4 py-2 flex items-center gap-3 border-b border-border bg-muted/30">
                    {highCount   > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold text-accent"><AlertTriangle className="h-3 w-3" />{highCount} high</span>}
                    {actionCount > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold text-primary"><Sparkles className="h-3 w-3" />{actionCount} actionable</span>}
                    <span className="ml-auto text-[10px] text-muted-foreground">{items.length.toLocaleString()} total</span>
                </div>
            )}
            <div className="flex-1 p-3 space-y-2">
                {items.length === 0
                    ? <EmptyState type={type} onGenerate={onGenerate} />
                    : preview.map((item, idx) =>
                        isAnomaly
                            ? <AnomalyCard key={item.id ?? idx} anomaly={item} />
                            : <InsightCard key={item.id ?? idx} insight={item} />
                    )
                }
            </div>
            {items.length > previewCount && (
                <button onClick={onViewAll}
                    className="px-4 py-2.5 border-t border-border text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-center">
                    View all {items.length.toLocaleString()} {title.toLowerCase()} →
                </button>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   InsightListPanel
   ───────────────────────────────────────────────────────────── */
function InsightListPanel({ items, title, icon, type, onGenerate, generating, isAnomaly = false }: {
    items: Insight[]; title: string; icon: React.ReactNode;
    type: string; onGenerate: () => void; generating: boolean; isAnomaly?: boolean;
}) {
    const f          = useInsightFilter(items);
    const collapsible = items.length > 15;

    return (
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
            <CardHeader icon={icon} title={title} count={items.length}
                action={
                    f.hasFilters ? (
                        <span className="text-[10px] font-black bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                            {f.filtered.length}
                        </span>
                    ) : undefined
                }
            />
            {items.length > 0 && (
                <FilterToolbar state={f} onGenerate={onGenerate} generating={generating} />
            )}
            <div>
                {items.length === 0 ? (
                    <div className="p-4"><EmptyState type={type} onGenerate={onGenerate} /></div>
                ) : f.paged.length === 0 ? (
                    <div className="p-4"><EmptyState type={type} onGenerate={onGenerate} isFiltered /></div>
                ) : (
                    <div className="p-3 space-y-2">
                        {f.paged.map((item, idx) =>
                            isAnomaly
                                ? <AnomalyCard key={item.id ?? idx} anomaly={item} collapsible={collapsible} />
                                : <InsightCard key={item.id ?? idx} insight={item} collapsible={collapsible} />
                        )}
                    </div>
                )}
            </div>
            <PaginationBar
                page={f.page} total={f.totalPages}
                count={items.length} filteredCount={f.filtered.length}
                onChange={f.setPage}
            />
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Main Dashboard
   ───────────────────────────────────────────────────────────── */
export default function AIDashboard({
    goalInsights:  initialGoalInsights,
    taskInsights:  initialTaskInsights,
    anomalies:     initialAnomalies,
    latestSummary,
    lastAnalyzed,
}: AIDashboardProps) {
    const [goalInsights]     = useState(initialGoalInsights  ?? []);
    const [taskInsights]     = useState(initialTaskInsights  ?? []);
    const [anomalies]        = useState(initialAnomalies     ?? []);
    const [executiveSummary] = useState(latestSummary);
    const [generating,  setGenerating] = useState(false);
    const [activeTab,   setActiveTab]  = useState('overview');

    const generateFreshInsights = async (type = 'all') => {
        setGenerating(true);
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res  = await fetch('/ai/generate-insights', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf || '',
                },
                body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (data.success) { toast.success('Insights generated!'); window.location.reload(); }
            else toast.error(data.message || 'Failed to generate insights');
        } catch {
            toast.error('Failed to generate insights. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const allInsights   = [...goalInsights, ...taskInsights, ...anomalies];
    const totalInsights = allInsights.length;
    const highPriority  = allInsights.filter(x => x.impact === 'high').length;
    const actionable    = [...goalInsights, ...taskInsights].filter(x => x.actionable).length;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'AI Dashboard', href: '/ai/dashboard' },
    ];

    const GenerateButton = ({ type = 'all', label = 'Generate All', className = '' }: { type?: string; label?: string; className?: string }) => (
        <button
            onClick={() => generateFreshInsights(type)}
            disabled={generating}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-black shadow-lg
                hover:brightness-95 transition-all active:scale-95 disabled:opacity-60 ${className}`}
        >
            {generating
                ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : label}
        </button>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-background">
                        {/* ── Hero — bg-primary replaces navy ── */}
                        <CustomPageHeader
                            title="AI Insights Dashboard"
                            subtitle="Data-driven recommendations to track goal compliance, task completion, and identify blockers."
                            icon={<Brain className="h-5 w-5 text-primary-foreground" />}
                            badge="Goal Analytics"
                            lastAnalyzed={lastAnalyzed}
                            stats={{
                                highPriority,
                                actionable,
                                totalInsights,
                            }}
                            actions={<GenerateButton />}
                        />

                        {/* ── Body ── */}
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                            {/* Stat tiles */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard delay={40}  label="Total Insights" value={totalInsights}       icon={<Lightbulb className="h-5 w-5" />}
                                    sub={highPriority > 0 ? `${highPriority} high priority` : undefined} />
                                <StatCard delay={70}  label="Goal Insights"  value={goalInsights.length} icon={<Target className="h-5 w-5" />} />
                                <StatCard delay={100} label="Task Insights"  value={taskInsights.length} icon={<CheckSquare className="h-5 w-5" />} />
                                <StatCard delay={130} label="Anomalies"      value={anomalies.length}    icon={<AlertTriangle className="h-5 w-5" />}
                                    accent
                                    sub={anomalies.filter(x => x.impact === 'high').length
                                        ? `${anomalies.filter(x => x.impact === 'high').length} critical`
                                        : undefined}
                                />
                            </div>

                            {/* Impact distribution */}
                            {totalInsights > 0 && (
                                <div style={fadeUp(160)} className="rounded-2xl border border-border bg-card shadow-sm px-5 py-5">
                                    <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                        </div>
                                        <p className="text-[10px] font-black tracking-widest uppercase text-foreground">Impact Distribution</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <ImpactBreakdownBar items={goalInsights} label="Goals"     />
                                        <ImpactBreakdownBar items={taskInsights} label="Tasks"     />
                                        <ImpactBreakdownBar items={anomalies}    label="Anomalies" />
                                    </div>
                                </div>
                            )}

                            {/* Executive summary */}
                            {executiveSummary && executiveSummary !== 'No summary available' && (
                                <div style={fadeUp(200)} className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
                                    <CardHeader icon={<Sparkles className="h-4 w-4" />} title="Executive Summary" />
                                    <div className="px-5 py-4">
                                        <p className="text-foreground leading-relaxed text-sm">{executiveSummary}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div style={fadeUp(240)}>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                                    <TabsList className="h-10 bg-card border border-border rounded-xl shadow-sm p-1 gap-0.5 w-full sm:w-auto sm:inline-flex">
                                        {[
                                            { value: 'overview',  icon: <BarChart3 className="h-3.5 w-3.5" />,    label: 'Overview'  },
                                            { value: 'goals',     icon: <Target className="h-3.5 w-3.5" />,        label: 'Goals',     count: goalInsights.length },
                                            { value: 'tasks',     icon: <CheckSquare className="h-3.5 w-3.5" />,   label: 'Tasks',     count: taskInsights.length },
                                            { value: 'anomalies', icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Anomalies', count: anomalies.length    },
                                        ].map(tab => (
                                            <TabsTrigger key={tab.value} value={tab.value}
                                                className="flex-1 sm:flex-none h-8 px-3 text-xs font-semibold gap-1.5 tracking-wide rounded-lg transition-all
                                                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                                                        text-muted-foreground hover:text-foreground">
                                                {tab.icon}
                                                <span>{tab.label}</span>
                                                {(tab.count ?? 0) > 0 && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                                        activeTab === tab.value
                                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>{tab.count}</span>
                                                )}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {/* OVERVIEW */}
                                    <TabsContent value="overview" className="space-y-4 mt-0">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <OverviewPreviewCard
                                                items={goalInsights} title="Goal Insights"
                                                icon={<Target className="h-4 w-4" />} type="goals"
                                                onGenerate={() => generateFreshInsights('goals')} generating={generating}
                                                onViewAll={() => setActiveTab('goals')}
                                            />
                                            <OverviewPreviewCard
                                                items={taskInsights} title="Task Insights"
                                                icon={<CheckSquare className="h-4 w-4" />} type="tasks"
                                                onGenerate={() => generateFreshInsights('tasks')} generating={generating}
                                                onViewAll={() => setActiveTab('tasks')}
                                            />
                                        </div>
                                        <OverviewPreviewCard
                                            items={anomalies} title="Recent Anomalies"
                                            icon={<AlertTriangle className="h-4 w-4" />} type="anomalies"
                                            onGenerate={() => generateFreshInsights('all')} generating={generating}
                                            onViewAll={() => setActiveTab('anomalies')} isAnomaly previewCount={6}
                                        />
                                    </TabsContent>

                                    {/* GOALS */}
                                    <TabsContent value="goals" className="space-y-4 mt-0">
                                        {goalInsights.filter(i => i.title?.includes('Overdue')).length > 0 && (
                                            <InsightListPanel
                                                items={goalInsights.filter(i => i.title?.includes('Overdue'))}
                                                title="Overdue Goals" icon={<Flag className="h-4 w-4" />} type="goals"
                                                onGenerate={() => generateFreshInsights('goals')} generating={generating}
                                            />
                                        )}
                                        <InsightListPanel
                                            items={goalInsights.filter(i => !i.title?.includes('Overdue'))}
                                            title="All Goal Insights" icon={<Target className="h-4 w-4" />} type="goals"
                                            onGenerate={() => generateFreshInsights('goals')} generating={generating}
                                        />
                                    </TabsContent>

                                    {/* TASKS */}
                                    <TabsContent value="tasks" className="space-y-4 mt-0">
                                        {taskInsights.filter(i => i.title?.includes('Overdue')).length > 0 && (
                                            <InsightListPanel
                                                items={taskInsights.filter(i => i.title?.includes('Overdue'))}
                                                title="Overdue Tasks" icon={<Flag className="h-4 w-4" />} type="tasks"
                                                onGenerate={() => generateFreshInsights('tasks')} generating={generating}
                                            />
                                        )}
                                        <InsightListPanel
                                            items={taskInsights.filter(i => !i.title?.includes('Overdue'))}
                                            title="All Task Insights" icon={<CheckSquare className="h-4 w-4" />} type="tasks"
                                            onGenerate={() => generateFreshInsights('tasks')} generating={generating}
                                        />
                                    </TabsContent>

                                    {/* ANOMALIES */}
                                    <TabsContent value="anomalies" className="mt-0">
                                        <InsightListPanel
                                            items={anomalies} title="Anomalies"
                                            icon={<AlertTriangle className="h-4 w-4" />} type="anomalies"
                                            onGenerate={() => generateFreshInsights('all')} generating={generating}
                                            isAnomaly
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
        </AppLayout>
        
    );
}