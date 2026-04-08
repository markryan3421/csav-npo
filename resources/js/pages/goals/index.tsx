import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GoalController from '@/actions/App/Http/Controllers/GoalController';
import SdgController from '@/actions/App/Http/Controllers/SdgController';
import { useMemo, useState } from 'react';
import { CustomTable } from '@/components/custom-table';
import { GoalsTableConfig } from '@/config/tables/goal-table';
import { CustomPagination } from '@/components/custom-pagination';
import { GoalFilterBar } from '@/components/goals/goal-filter-bar';
import { PermissionGuard } from '@/components/permission-guard';
import DeleteConfirmationModal from '@/components/delete-confirmation-modal';

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

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface GoalPagination {
    data: Goal[];
    links: LinkProps;
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    search: string;
    perPage: string;
}

interface IndexProps {
    goals: GoalPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    selectedSdg: Sdg;
    totalGoals: number;
    compliantGoals: number;
    nonCompliantGoals: number;
    sdgs: Sdg[];
    assignedGoalsCount: number;
}

interface FlashProps extends Record<string, any> {
    flash?: { success?: string; error?: string; }
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
    filters, totalCount, filteredCount, selectedSdg, goals, totalGoals, compliantGoals,
    nonCompliantGoals, sdgs, assignedGoalsCount,
}: IndexProps) {

    const breadcrumbs: BreadcrumbItem[] = [
        { title: selectedSdg?.name ?? 'Goals', href: '/goals' },
    ];

    const { delete: destroy } = useForm();
    // Derived analytics
    const safeGoals  = goals?.data ?? [];
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

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(GoalController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchChange = (value: string) => {
        setData('search', value);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        router.get(GoalController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearAll = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get(GoalController.index.url(), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleViewClick = (goal: { slug: string }) => {
        router.get(GoalController.show({ goal: goal.slug }).url);
    };

    const handleEditClick = (goal: { slug: string }) => {
        router.get(GoalController.edit({ goal: goal.slug }).url);
    };

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (goal: Goal) => {
        setItemToDelete(goal);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        destroy(GoalController.destroy({ goal: itemToDelete.slug }).url, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Contribution version deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const hasActiveFilters = !!data.search.trim();

    const { auth } = usePage().props as any;
    const permissions = auth.permissions;

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

                        <PermissionGuard permission="create goal" fallback={null}>
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
                        </PermissionGuard>
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
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <CustomTable
                                    columns={GoalsTableConfig.columns}
                                    actions={GoalsTableConfig.actions}
                                    data={safeGoals}
                                    from={goals.from}
                                    onDelete={handleDeleteClick}
                                    onView={handleViewClick}
                                    onEdit={handleEditClick}
                                    isModal={true}
                                    title="Goals"
                                    toolbar={
                                        <GoalFilterBar 
                                            filters={{
                                                search: true,
                                                sdg: false,
                                                priority: false,
                                                status: true,
                                                date: false,
                                            }}
                                            searchTerm={data.search}
                                            onSearchChange={handleSearchChange}
                                            onClearAll={hasActiveFilters ? handleClearAll : undefined}
                                            searchPlaceholder='Search by goal name or description...'
                                        />
                                    }
                                    filterEmptyState={
                                        hasActiveFilters && goals.data.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                                    No results found
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                                    No goals matching "{data.search}".
                                                </p>
                                                <Button variant="outline" size="sm" onClick={handleClearAll}>
                                                    Clear search
                                                </Button>
                                            </div>
                                        ) : undefined
                                    }
                                />

                                <CustomPagination
                                    pagination={goals}
                                    perPage={data.perPage}
                                    onPerPageChange={handlePerPageChange}
                                    totalCount={totalCount}
                                    filteredCount={filteredCount}
                                    search={data.search}
                                    resourceName='goals'
                                />
                            </div>

                            <DeleteConfirmationModal
                                open={deleteDialogOpen}
                                onClose={() => {
                                    setDeleteDialogOpen(false);
                                    setItemToDelete(null);
                                }}
                                onConfirm={confirmDelete}
                                title='Delete Goal Item'
                                itemName={itemToDelete?.title}
                                isLoading={isDeleting}
                                confirmText='Delete Goal'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}