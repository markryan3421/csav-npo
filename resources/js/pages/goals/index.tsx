import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CustomToast, toast } from '@/components/custom-toast';
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontalIcon, Pencil, Trash2, Target, Plus, Eye,
    TrendingUp, CheckCircle2, XCircle, Flag, Users,
    ChevronRight, BarChart3, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GoalController from '@/actions/App/Http/Controllers/GoalController';
import SdgController from '@/actions/App/Http/Controllers/SdgController';
import { useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Goal {
    id: number;
    project_manager_id: number;
    sdg_id: number;
    title: string;
    slug: string;
    description: string;
    status: string;
    type: string;
    compliance_percentage?: number;
    start_date?: string;
    end_date?: string;
}

interface Sdg {
    id: number;
    name: string;
    slug: string;
    description: string;
}

interface IndexProps {
    selectedSdg: Sdg;
    goals: Goal[];
    totalGoals: number;
    compliantGoals: number;
    nonCompliantGoals: number;
    sdgs: Sdg[];
    assignedGoalsCount: number;
}

interface FlashProps extends Record<string, any> {
    flash?: { success?: string; error?: string; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
    pending:     { badge: 'bg-secondary text-secondary-foreground',              dot: 'bg-secondary', label: 'Pending'     },
    'in-progress':{ badge: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary',  label: 'In Progress' },
    completed:   { badge: 'bg-primary text-primary-foreground',                  dot: 'bg-primary',   label: 'Completed'   },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted', label: status };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {type === 'long' ? 'Long-Term' : 'Short-Term'}
        </span>
    );
}

// ── Animated stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, index }: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    sub?: string;
    color: 'primary' | 'secondary' | 'accent' | 'card';
    index: number;
}) {
    const bg = {
        primary:   'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        accent:    'bg-accent text-accent-foreground',
        card:      'bg-card text-foreground border border-border',
    }[color];

    const iconBg = {
        primary:   'bg-primary-foreground/15',
        secondary: 'bg-secondary-foreground/15',
        accent:    'bg-accent-foreground/15',
        card:      'bg-primary/10',
    }[color];

    const iconColor = color === 'card' ? 'text-primary' : 'opacity-90';

    return (
        <div
            className={`stat-card flex flex-col gap-3 rounded-2xl p-5 shadow-md ${bg}`}
            style={{ animationDelay: `${index * 70}ms` }}
        >
            <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                {sub && (
                    <span className={`text-[10px] font-semibold opacity-60`}>{sub}</span>
                )}
            </div>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>{label}</p>
                <p className="mt-0.5 text-4xl font-extrabold">{value}</p>
            </div>
        </div>
    );
}

// ── Compliance ring ───────────────────────────────────────────────────────────
function ComplianceRing({ compliant, total }: { compliant: number; total: number }) {
    const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="ring-fill transition-all duration-1000"
                        style={{ strokeDashoffset: offset }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-foreground">{pct}%</span>
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Compliance Rate
            </p>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Index({
    selectedSdg, goals, totalGoals, compliantGoals,
    nonCompliantGoals, sdgs, assignedGoalsCount,
}: IndexProps) {

    const breadcrumbs: BreadcrumbItem[] = [
        { title: selectedSdg?.name ?? 'Goals', href: '/goals' },
    ];

    // Derived analytics
    const safeGoals  = goals  ?? [];
    const safeSdgs   = sdgs   ?? [];
    const completionPct = totalGoals > 0 ? Math.round((compliantGoals / totalGoals) * 100) : 0;

    const byStatus = useMemo(() => ({
        pending:     safeGoals.filter((g) => g.status === 'pending').length,
        inProgress:  safeGoals.filter((g) => g.status === 'in-progress').length,
        completed:   safeGoals.filter((g) => g.status === 'completed').length,
    }), [safeGoals]);

    const byType = useMemo(() => ({
        long:  safeGoals.filter((g) => g.type === 'long').length,
        short: safeGoals.filter((g) => g.type === 'short').length,
    }), [safeGoals]);

    const handleDelete = (goal: { slug: string }) => {
        router.delete(GoalController.destroy({ goal: goal.slug }).url, {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success || 'Goal deleted successfully.');
            },
            onError: (error: Record<string, string>) => {
                toast.error(error?.message || 'Failed to delete goal.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${selectedSdg?.name ?? 'Goals'} — Dashboard`} />
            <CustomToast />

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .stat-card   { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                .section-in  { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .page-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes tableRowIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .table-row { animation: tableRowIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes fillBar {
                    from { width: 0%; }
                    to   { width: var(--bar-w); }
                }
                .bar-fill { animation: fillBar 0.9s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
                @keyframes ringFill {
                    from { stroke-dashoffset: 226; }
                }
                .ring-fill { animation: ringFill 1s cubic-bezier(0.22,1,0.36,1) 0.5s both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* ── Page header ── */}
                    <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg">
                                <Target className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {selectedSdg?.name ?? 'Overview'}
                                </p>
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                    Goals{' '}
                                    <span className="relative inline-block text-primary">
                                        Dashboard
                                        <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-secondary" />
                                    </span>
                                </h1>
                            </div>
                        </div>

                        <Link
                            as="button"
                            href={GoalController.create().url}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                       active:scale-95 hover:brightness-110 hover:shadow-lg
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Goal
                        </Link>
                    </div>

                    {/* ── Stat cards: 2 col mobile → 4 col desktop ── */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard icon={Flag}        label="Total Goals"      value={totalGoals}         color="primary"   index={0} />
                        <StatCard icon={Users}        label="Assigned to You"  value={assignedGoalsCount} color="card"      index={1} />
                        <StatCard icon={CheckCircle2} label="Compliant"        value={compliantGoals}     color="secondary" index={2} />
                        <StatCard icon={XCircle}      label="Non-Compliant"    value={nonCompliantGoals}  color="accent"    index={3} />
                    </div>

                    {/* ── Analytics row ── */}
                    <div className="section-in grid grid-cols-1 gap-5 lg:grid-cols-3" style={{ animationDelay: '150ms' }}>

                        {/* Compliance ring + breakdown */}
                        <div className="col-span-1 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Compliance Overview</h2>
                            </div>

                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
                                <ComplianceRing compliant={compliantGoals} total={totalGoals} />

                                <div className="w-full max-w-[160px] space-y-3">
                                    {[
                                        { label: 'Compliant',     val: compliantGoals,    color: '#004f39' },
                                        { label: 'Non-Compliant', val: nonCompliantGoals, color: '#eb3d00' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                                                <span className="text-xs font-black text-foreground">{val}</span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                                                <div
                                                    className="bar-fill h-full rounded-full"
                                                    style={{
                                                        backgroundColor: color,
                                                        '--bar-w': totalGoals > 0 ? `${(val / totalGoals) * 100}%` : '0%',
                                                    } as React.CSSProperties}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="col-span-1 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Status Breakdown</h2>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: 'Completed',   val: byStatus.completed,  color: '#004f39', bg: 'bg-primary/10 text-primary'              },
                                    { label: 'In Progress', val: byStatus.inProgress, color: '#fdfa00', bg: 'bg-secondary text-secondary-foreground'   },
                                    { label: 'Pending',     val: byStatus.pending,    color: '#eb3d00', bg: 'bg-accent/10 text-accent'                 },
                                ].map(({ label, val, color, bg }) => (
                                    <div key={label} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${bg}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-foreground">
                                                {val}
                                                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                                    / {totalGoals}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                            <div
                                                className="bar-fill h-full rounded-full"
                                                style={{
                                                    backgroundColor: color,
                                                    '--bar-w': totalGoals > 0 ? `${(val / totalGoals) * 100}%` : '0%',
                                                } as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Type distribution + SDG switcher */}
                        <div className="col-span-1 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <Clock className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Goal Types</h2>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { label: 'Long-Term',  val: byType.long,  color: '#004f39' },
                                    { label: 'Short-Term', val: byType.short, color: '#fdfa00' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-foreground">{label}</span>
                                            <span className="font-black text-foreground">{val}</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                            <div
                                                className="bar-fill h-full rounded-full"
                                                style={{
                                                    backgroundColor: color,
                                                    '--bar-w': totalGoals > 0 ? `${(val / totalGoals) * 100}%` : '0%',
                                                } as React.CSSProperties}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall progress */}
                            <div className="mt-auto rounded-xl bg-primary/5 p-4">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-muted-foreground">Overall Completion</span>
                                    <span className="font-black text-foreground">{completionPct}%</span>
                                </div>
                                <Progress value={completionPct} className="h-2" />
                            </div>
                        </div>
                    </div>

                    {/* ── SDG Switcher ── */}
                    {safeSdgs.length > 0 && (
                        <div className="section-in" style={{ animationDelay: '220ms' }}>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Switch SDG
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {safeSdgs.map((sdg) => {
                                    const active = selectedSdg?.id === sdg.id;
                                    return (
                                        <Link
                                            key={sdg.id}
                                            href={SdgController.changeSdg({ sdg: sdg.slug }).url}
                                            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-95
                                                ${active
                                                    ? 'bg-primary text-primary-foreground shadow-md'
                                                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                                }`}
                                        >
                                            {active && <ChevronRight className="h-3.5 w-3.5" />}
                                            {sdg.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Goals table ── */}
                    <div className="section-in" style={{ animationDelay: '280ms' }}>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {safeGoals.length} goal{safeGoals.length !== 1 ? 's' : ''} in {selectedSdg?.name}
                            </p>
                        </div>

                        {safeGoals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                    <Target className="h-8 w-8 text-primary/50" />
                                </div>
                                <p className="text-lg font-semibold text-muted-foreground">No goals yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create your first goal for <strong>{selectedSdg?.name}</strong>.
                                </p>
                                <Link
                                    href={GoalController.create().url}
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create First Goal
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-primary hover:bg-primary">
                                                <TableHead className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/70">
                                                    Goal
                                                </TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/70">
                                                    Type
                                                </TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/70">
                                                    Status
                                                </TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-wider text-primary-foreground/70">
                                                    Progress
                                                </TableHead>
                                                <TableHead className="w-10" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeGoals.map((goal, index) => {
                                                const pct = Math.min(100, Math.max(0, goal.compliance_percentage ?? 0));
                                                return (
                                                    <TableRow
                                                        key={goal.id}
                                                        className="table-row group transition-colors hover:bg-primary/5"
                                                        style={{ animationDelay: `${300 + index * 40}ms` }}
                                                    >
                                                        {/* Goal title + description */}
                                                        <TableCell className="max-w-[240px]">
                                                            <Link href={GoalController.show({ goal: goal.slug }).url}>
                                                                <p className="truncate font-semibold text-foreground transition-colors hover:text-primary">
                                                                    {goal.title}
                                                                </p>
                                                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                                                    {goal.description}
                                                                </p>
                                                            </Link>
                                                        </TableCell>

                                                        <TableCell>
                                                            <TypeBadge type={goal.type} />
                                                        </TableCell>

                                                        <TableCell>
                                                            <StatusBadge status={goal.status} />
                                                        </TableCell>

                                                        {/* Progress mini-bar */}
                                                        <TableCell className="min-w-[120px]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                                                                    <div
                                                                        className="bar-fill h-full rounded-full bg-primary"
                                                                        style={{
                                                                            '--bar-w': `${pct}%`,
                                                                        } as React.CSSProperties}
                                                                    />
                                                                </div>
                                                                <span className="w-8 text-right text-[10px] font-black text-muted-foreground">
                                                                    {pct}%
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Actions */}
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                                        aria-label="Goal actions"
                                                                    >
                                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={GoalController.show({ goal: goal.slug }).url}
                                                                            className="flex items-center gap-2 text-sm"
                                                                        >
                                                                            <Eye className="h-3.5 w-3.5 text-primary" />
                                                                            View
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem asChild>
                                                                        <Link
                                                                            href={GoalController.edit({ goal: goal.slug }).url}
                                                                            className="flex items-center gap-2 text-sm"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5 text-primary" />
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(goal)}
                                                                        className="flex items-center gap-2 text-sm text-accent focus:text-accent"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Table footer */}
                                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
                                    <p className="text-xs text-muted-foreground">
                                        {safeGoals.length} goal{safeGoals.length !== 1 ? 's' : ''} total
                                    </p>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black text-secondary-foreground">
                                        {completionPct}% complete
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}