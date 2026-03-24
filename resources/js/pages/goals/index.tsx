import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CustomToast, toast } from '@/components/custom-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, Pencil, Trash2, Target, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoalController from '@/actions/App/Http/Controllers/GoalController';
import SdgController from '@/actions/App/Http/Controllers/SdgController';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

interface Goal {
    id: number;
    project_manager_id: number;
    sdg_id: number;
    title: string;
    slug: string;
    description: string;
    status: string;
    type: string;
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

// Status badge — maps status string to token-based classes
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-secondary text-secondary-foreground',
        'in-progress': 'bg-primary/10 text-primary',
        completed: 'bg-primary text-primary-foreground',
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {status}
        </span>
    );
}

// Type badge
function TypeBadge({ type }: { type: string }) {
    return (
        <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {type === 'long' ? 'Long-Term' : 'Short-Term'}
        </span>
    );
}

export default function Index({ selectedSdg, goals, totalGoals, compliantGoals, nonCompliantGoals, sdgs, assignedGoalsCount }: IndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: selectedSdg?.name ?? 'Goals', href: `/sdg` },
    ];

    const handleDelete = (goal: { slug: string }) => {
        router.delete(
            GoalController.destroy({ goal: goal.slug }).url,
            {
                onSuccess: (response: { props: FlashProps }) => {
                    toast.success(response.props.flash?.success || 'Goal deleted successfully.');
                },
                onError: (error: Record<string, string>) => {
                    toast.error(error?.message || 'Failed to delete Goal.');
                },
            }
        );
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Goals Dashboard" />

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <CustomToast />

                    {/* ── Page Header ── */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg">
                                <Target className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {selectedSdg?.name}
                                </p>
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                    Goals
                                </h1>
                            </div>
                        </div>

                        {/* Create Goal — 60% primary */}
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

                    {/* ── Stat cards ── */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Total — 60% primary */}
                        <div className="flex flex-col gap-1 rounded-2xl bg-primary p-5 shadow-md">
                            <p className="text-xs font-black uppercase tracking-widest text-primary-foreground/70">
                                Total Goals
                            </p>
                            <p className="text-4xl font-extrabold text-primary-foreground">{totalGoals}</p>
                        </div>

                        {/* Assigned Goals Card */}
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Assigned to You
                            </p>
                            <p className="mt-1 text-3xl font-extrabold text-foreground">{assignedGoalsCount}</p>
                            {/* <p className="mt-1 text-xs text-muted-foreground">
                                {completionPercentage}% of total
                            </p> */}
                        </div>

                        {/* Compliant — 30% secondary */}
                        <div className="flex flex-col gap-1 rounded-2xl bg-secondary p-5 shadow-md">
                            <p className="text-xs font-black uppercase tracking-widest text-secondary-foreground/70">
                                Compliant
                            </p>
                            <p className="text-4xl font-extrabold text-secondary-foreground">{compliantGoals}</p>
                        </div>

                        {/* Non-compliant — 10% accent */}
                        <div className="flex flex-col gap-1 rounded-2xl bg-accent p-5 shadow-md">
                            <p className="text-xs font-black uppercase tracking-widest text-accent-foreground/70">
                                Non-Compliant
                            </p>
                            <p className="text-4xl font-extrabold text-accent-foreground">{nonCompliantGoals}</p>
                        </div>
                    </div>

                    {/* ── SDG Switcher ── */}
                    {sdgs?.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            {sdgs.map((sdg) => (
                                <Link
                                    key={sdg.id}
                                    href={SdgController.changeSdg({ sdg: sdg.slug }).url}
                                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150
                                        ${selectedSdg?.id === sdg.id
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                        }`}
                                >
                                    {sdg.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── Goals table ── */}
                    {goals?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                            <Target className="mb-4 h-12 w-12 text-primary opacity-40" />
                            <p className="text-lg font-semibold text-muted-foreground">No goals yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create your first goal for <strong>{selectedSdg?.name}</strong>.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                            Title
                                        </TableHead>
                                        <TableHead className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                            Type
                                        </TableHead>
                                        <TableHead className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {goals.map((goal) => (
                                        <TableRow key={goal.id} className="group transition-colors hover:bg-primary/5">
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-foreground">{goal.title}</p>
                                                    <p className="line-clamp-1 text-xs text-muted-foreground">{goal.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <TypeBadge type={goal.type} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={goal.status} />
                                            </TableCell>
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
                                                        {/* View — primary */}
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={GoalController.show({ goal: goal.slug }).url}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                <Eye className="h-3.5 w-3.5 text-primary" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {/* Edit — primary */}
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
                                                        {/* Delete — accent */}
                                                        <DropdownMenuItem className="flex items-center gap-2 text-sm text-accent focus:text-accent">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <Button
                                                                variant="ghost"
                                                                className="text-accent"
                                                                onClick={() => handleDelete(goal)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}