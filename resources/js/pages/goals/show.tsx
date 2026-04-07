import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ArrowLeft, Target, Flag, Users, CalendarDays, TrendingUp,
    ChevronDown, Plus, Pencil, Trash2, CheckCircle2,
    XCircle, Clock, RotateCcw, FileText,
    ExternalLink, MoreVertical, Filter, ShieldCheck,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { format, startOfDay } from 'date-fns';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';
import TaskController from '@/actions/App/Http/Controllers/TaskController';
import { useTaskHighlight } from '@/hooks/use-task-highlight';
import { PermissionGuard } from '@/components/permission-guard';
import { CustomToast, toast } from '@/components/custom-toast';
import DeleteConfirmationDialog from '@/components/delete-user';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskProductivityFile { id: number; file_name: string; file_path: string; }
interface TaskProductivity {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | string;
    remarks?: string | null;
    created_at: string;
    user: { id: number; name: string; avatar?: string | null; };
    task_productivity_files: TaskProductivityFile[];
}
interface Task {
    id: number; slug: string; title: string; description: string;
    task: string;
    deadline: string | null; status: string; created_at: string;
    task_productivities?: TaskProductivity[];
}
interface Sdg { id: number; name: string; slug?: string; description?: string; }
interface SdgWithUsers extends Sdg {
    users?: { id: number; name: string; email: string; avatar?: string | null; }[];
}
interface Goal {
    id: number; slug: string; title: string; description: string;
    status: string; type: string; start_date: string; end_date: string;
    compliance_percentage: number;
    goal_with_sdgs: SdgWithUsers[];
    sdg_id: number;
    project_manager: { id: number; name: string; avatar?: string | null; } | null;
    assigned_users: { id: number; name: string; email: string; avatar?: string | null; }[];
    tasks: Task[];
}
interface ShowProps { goal: Goal; authUserRole: string | string[]; authUserId: number; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(d).toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });

const fmtFull = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

function deadlineInfo(dl: string | null): { label: string; color: string } {
    if (!dl) return { label: 'No deadline', color: 'text-muted-foreground' };
    const diff = Math.floor((new Date(dl).getTime() - Date.now()) / 86400000);
    if (diff > 1) return { label: `${diff}d left`, color: 'text-green-600 dark:text-green-400' };
    if (diff === 1) return { label: '1 day left', color: 'text-yellow-600 dark:text-yellow-400' };
    if (diff === 0) return { label: 'Due today', color: 'text-orange-500' };
    return { label: 'Overdue', color: 'text-accent' };
}

function durationLabel(start: string, end: string): string {
    const days = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    const now = Date.now();
    const endMs = new Date(end).getTime();
    const startMs = new Date(start).getTime();
    if (endMs < now) return `${days} days (Completed)`;
    if (startMs > now) return `${days} days (Starts in ${Math.ceil((startMs - now) / 86400000)}d)`;
    return `${days} days (Ends in ${Math.ceil((endMs - now) / 86400000)}d)`;
}

// ── Badge configs ─────────────────────────────────────────────────────────────
const TASK_STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    pending: { label: 'Pending', badge: 'bg-secondary text-secondary-foreground' },
    approved: { label: 'Approved', badge: 'bg-primary/10 text-primary border border-primary/20' },
    completed: { label: 'Approved', badge: 'bg-primary/10 text-primary border border-primary/20' },
    rejected: { label: 'Rejected', badge: 'bg-accent/10 text-accent border border-accent/20' },
    resubmission_requested: { label: 'Resubmission Req.', badge: 'bg-primary/10 text-primary border border-primary/20' },
    approved_resubmission: { label: 'Resubmission OK', badge: 'bg-primary/10 text-primary border border-primary/20' },
    rejected_resubmission: { label: 'Resubmission Rejected', badge: 'bg-accent/10 text-accent border border-accent/20' },
    completed_late: { label: 'Completed (Late)', badge: 'bg-secondary text-secondary-foreground' },
};

function TaskStatusBadge({ status }: { status: string }) {
    const cfg = TASK_STATUS_CONFIG[status] ?? { label: status, badge: 'bg-muted text-muted-foreground' };
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>{cfg.label}</span>;
}

function GoalStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-secondary text-secondary-foreground',
        'in-progress': 'bg-primary/10 text-primary border border-primary/20',
        completed: 'bg-primary text-primary-foreground',
    };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${map[status] ?? 'bg-muted text-muted-foreground'}`}>{status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>;
}

// ── Reusable Section ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, action, delay = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode; delay?: number;
}) {
    return (
        <div className="show-section space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
            style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 'md' }: { name: string; avatar?: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-xl' : 'h-9 w-9 text-xs';
    return avatar ? (
        <img src={`/storage/${avatar}`} alt={name} className={`${sz} shrink-0 rounded-full object-cover ring-2 ring-primary/20`} />
    ) : (
        <div className={`${sz} shrink-0 flex items-center justify-center rounded-full bg-primary font-black text-primary-foreground`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ── Task Item ─────────────────────────────────────────────────────────────────
function TaskItem({ task, goalSlug }: {
    task: Task; goalSlug: string;
}) {
    const { delete: destroy } = useForm();
    const [open, setOpen] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState<Date | undefined>();
    const [calOpen, setCalOpen] = useState(false);

    const dl = deadlineInfo(task.deadline);
    const submissions = task.task_productivities ?? [];
    const submissionCount = submissions.length;

    const handleApproveResubmission = () => {
        if (!newDeadline) return;
        router.put(`/tasks/${task.slug}/approve-resubmission`, { deadline: format(newDeadline, 'yyyy-MM-dd') }, {
            onSuccess: () => {
                setExtendOpen(false);
                toast.success('Resubmission approved successfully.');
            },
            onError: () => toast.error('Please fix the errors below.'),
        });
    };

    const handleApproveSubmission = (id: number) => {
        router.put(TaskProductivityController.approveSubmission(id).url, { preserveScroll: true }), {
            onSuccess: () => toast.success('Task submission approved successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
        };
    };

    const handleRejectResubmission = () => {
        router.put(`/tasks/${task.slug}/reject-resubmission`), {
            onSuccess: () => toast.success('Reject resubmission sent successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
        };
    };

    const handleRequestResubmission = () => {
        router.put(TaskProductivityController.requestResubmission({ task: task.slug }).url), {
            onSuccess: () => toast.success('Request resubmission sent successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
        };
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Updated delete handler to open confirmation dialog
    const handleDeleteTask = (task: Task) => {
        setTaskToDelete(task);
        setDeleteDialogOpen(true);
    };

    // Actual delete execution
    const confirmDelete = () => {
        if (!taskToDelete) return;

        setIsDeleting(true);
        destroy(TaskController.destroy({ goal: goalSlug, task: taskToDelete.slug }).url, {
            onSuccess: (page: { props: any; }) => {
                const successMessage = (page.props as any).flash?.success || 'Task deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setTaskToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete task.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    return (
        <div className="task-item group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
            {/* Header */}
            <div
                id={`task-${task.slug}`}
                className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-primary/5"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {/* Animated chevron */}
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-all duration-200 group-hover:border-primary/40 ${open ? 'bg-primary border-primary' : ''}`}>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180 text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{task.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {task.deadline && (
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {fmt(task.deadline, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                            </span>
                            {task.deadline && (
                                <span className={`flex items-center gap-1 font-semibold ${dl.color}`}>
                                    <Clock className="h-3 w-3" />
                                    {dl.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2" onClick={e => e.stopPropagation()}>
                    <TaskStatusBadge status={task.status} />

                    {task.status === 'pending' && (
                        task.deadline && new Date() < new Date(task.deadline) ? (
                            <PermissionGuard permission="submit productivity" fallback={null}>
                                <Link href={`/tasks/${task.slug}/submit`}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                    Submit
                                </Link>
                            </PermissionGuard>
                        ) : (
                            <PermissionGuard permission="request resubmission productivity" fallback={null}>
                                <button onClick={handleRequestResubmission}
                                    className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground transition-all hover:brightness-95 active:scale-95">
                                    <RotateCcw className="h-3 w-3" /> Request Resubmission
                                </button>
                            </PermissionGuard>
                        )
                    )}

                    {task.status === 'resubmission_requested' && (
                        <div className="flex items-center gap-1">
                            <PermissionGuard permission="approve resubmission productivity">
                                <button onClick={() => setExtendOpen(true)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                    <CheckCircle2 className="h-3 w-3" /> Approve
                                </button>
                            </PermissionGuard>
                            <PermissionGuard permission="reject productivity">
                                <button onClick={handleRejectResubmission}
                                    className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1.5 text-[11px] font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-95">
                                    <XCircle className="h-3 w-3" /> Reject
                                </button>
                            </PermissionGuard>
                        </div>
                    )}

                    {task.status === 'approved_resubmission' && (
                        <PermissionGuard permission="submit productivity">
                            <Link href={`/tasks/${task.slug}/late-resubmit`}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                Submit Now
                            </Link>
                        </PermissionGuard>
                    )}

                    {task.status === 'rejected_resubmission' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] text-accent">
                            <XCircle className="h-3 w-3" /> Resubmission Rejected
                        </span>
                    )}

                    {(task.status === 'completed' || task.status === 'approved') && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                    )}

                    {task.status === 'completed_late' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] text-secondary-foreground">
                            <Clock className="h-3 w-3" /> Completed (Late)
                        </span>
                    )}

                    <PermissionGuard permission="modify-task">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                <PermissionGuard permission="edit task">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/goals/${goalSlug}/tasks/${task.slug}/edit`} className="flex items-center gap-2 text-sm">
                                            <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
                                        </Link>
                                    </DropdownMenuItem>
                                </PermissionGuard>
                                <PermissionGuard permission="delete task">
                                    <DropdownMenuItem onClick={() => handleDeleteTask(task)} className="flex items-center gap-2 text-sm text-accent focus:text-accent">
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </DropdownMenuItem>
                                </PermissionGuard>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </PermissionGuard>
                </div>
            </div>

            {/* Body */}
            {open && (
                <div className="space-y-5 border-t border-border/60 p-5">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{task.description}</p>

                    {/* Detail cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</p>
                            {task.deadline ? (
                                <>
                                    <p className="text-sm font-bold text-foreground">{fmt(task.deadline)}</p>
                                    <p className={`mt-1 text-xs font-semibold ${dl.color}`}>{dl.label}</p>
                                </>
                            ) : <p className="text-sm italic text-muted-foreground">Not set</p>}
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Created</p>
                            <p className="text-sm font-bold text-foreground">{fmt(task.created_at)}</p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submissions</p>
                            <p className="text-3xl font-extrabold text-foreground">{submissionCount}</p>
                            {submissionCount > 0 && (() => {
                                const approved = submissions.filter(s => s.status === 'approved').length;
                                const rate = Math.round((approved / submissionCount) * 100);
                                return (
                                    <div className="mt-1">
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">{approved} approved · {rate}%</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Submissions */}
                    {submissionCount > 0 ? (
                        <div className="space-y-3 border-t border-border pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submissions</p>
                            {submissions.map((sub) => (
                                <div key={sub.id} className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <Avatar name={sub.user?.name ?? 'U'} avatar={sub.user?.avatar} size="md" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">{sub.user?.name ?? 'Unknown'}</p>
                                                <p className="text-xs text-muted-foreground">{fmt(sub.created_at)}</p>

                                                {sub.task_productivity_files?.length > 0 && (
                                                    <div className="mt-3 space-y-1.5">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Files</p>
                                                        {sub.task_productivity_files.map((file) => (
                                                            <div key={file.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                    <span className="truncate text-xs text-foreground">{file.file_name}</span>
                                                                </div>
                                                                <a href={`/storage/${file.file_path}`} target="_self"
                                                                    className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                                                                    <ExternalLink className="h-3 w-3" /> Open
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {sub.status === 'rejected' && sub.remarks && (
                                                    <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-accent">Rejection Remarks</p>
                                                        <p className="text-xs text-foreground">{sub.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submission actions */}
                                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                            {sub.status === 'approved' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                                                </span>
                                            ) : sub.status === 'rejected' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                                                    <XCircle className="h-3.5 w-3.5" /> Rejected
                                                </span>
                                            ) : sub.status === 'rejected' ? (
                                                <PermissionGuard permission="resubmit productivity">
                                                    <Link href={TaskProductivityController.showResubmitForm({ task: task.slug, task_productivity: sub.id }).url}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground transition-all hover:brightness-95 active:scale-95">
                                                        <RotateCcw className="h-3.5 w-3.5" /> Resubmit
                                                    </Link>
                                                </PermissionGuard>
                                            ) : sub.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <PermissionGuard permission="approve productivity">
                                                        <button onClick={() => handleApproveSubmission(sub.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                        </button>
                                                    </PermissionGuard>
                                                    <PermissionGuard permission="reject productivity">
                                                        <Link href={TaskProductivityController.rejectSubmissionForm(sub.id).url}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-95">
                                                            <XCircle className="h-3.5 w-3.5" /> Reject
                                                        </Link>
                                                    </PermissionGuard>
                                                </div>
                                            ) : (
                                                <span>{sub.status}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center">
                            <FileText className="mb-2 h-8 w-8 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">No submissions yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Extend deadline dialog with shadcn Calendar ── */}
            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                <CalendarDays className="h-4 w-4 text-primary" />
                            </div>
                            Extend Task Deadline
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Approve resubmission and grant a new deadline for this task.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* shadcn Calendar date picker — replaces plain <input type="date"> */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                <span className="text-accent">* </span>New Deadline
                            </Label>
                            <Popover open={calOpen} onOpenChange={setCalOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline"
                                        className="h-11 w-full justify-start rounded-xl border-2 font-normal transition-all hover:border-primary">
                                        <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {newDeadline
                                            ? format(newDeadline, 'PPP')
                                            : <span className="text-muted-foreground">Pick a future date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newDeadline}
                                        captionLayout="dropdown"
                                        onSelect={(d) => { setNewDeadline(d); setCalOpen(false); }}
                                        disabled={(d) => d < startOfDay(new Date())}
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground">Must be a future date</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button onClick={handleApproveResubmission} disabled={!newDeadline}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 active:scale-95">
                                <CheckCircle2 className="h-4 w-4" /> Approve & Extend
                            </button>
                            <button onClick={() => setExtendOpen(false)}
                                className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95">
                                Cancel
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setTaskToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Task"
                itemName={taskToDelete?.slug}
                isLoading={isDeleting}
                confirmText="Delete Task"
            />
        </div>
    );
}

// ── Filter config ─────────────────────────────────────────────────────────────
const TASK_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'pending', label: 'Pending' },
    { key: 'resubmission_requested', label: 'Resubmission Req.' },
    { key: 'approved_resubmission', label: 'Resubmission OK' },
    { key: 'rejected_resubmission', label: 'Rejected Resubmission' },
    { key: 'completed_late', label: 'Late' },
];

const normStatus = (s: string) => s === 'completed' ? 'approved' : s;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShowGoal({ goal, authUserRole, authUserId }: ShowProps) {
    const roleValue = Array.isArray(authUserRole) ? (authUserRole[0] ?? 'staff') : authUserRole;

    const [taskFilter, setTaskFilter] = useState('all');

    const tasks = goal.tasks ?? [];
    const assignedUsers = goal.assigned_users ?? [];
    const sdgs = goal.goal_with_sdgs ?? [];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        { title: goal.title, href: `/goals/${goal.slug}` },
    ];

    const filteredTasks = useMemo(() =>
        taskFilter === 'all'
            ? tasks
            : tasks.filter(t => normStatus(t.status) === taskFilter),
        [tasks, taskFilter]
    );

    const progressPct = Math.min(100, Math.max(0, goal.compliance_percentage ?? 0));
    const completionPct = progressPct;

    // Add these state variables with your other useState declarations
    const [activeSdgTab, setActiveSdgTab] = useState(sdgs[0]?.id || 0);
    const [expandedSdg, setExpandedSdg] = useState<number | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={goal.title} />
            <CustomToast />

            <style>{`
                @keyframes showReveal {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .show-section { animation: showReveal 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .show-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes progressFill {
                    from { width: 0%; }
                    to   { width: var(--pw); }
                }
                .progress-bar { animation: progressFill 1s cubic-bezier(0.22,1,0.36,1) 0.5s both; }
                .task-item:hover { transform: translateY(-1px); }
                .task-item { transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; }
            `}</style>

            <div className="min-h-screen py-8 md:py-12">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">

                    {/* ── Page header ── */}
                    <div className="show-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <GoalStatusBadge status={goal.status} />
                                <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
                                    {goal.type} Term
                                </span>
                                {sdgs.slice(0, 3).map(sdg => (
                                    <span key={sdg.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                                        <Target className="h-3 w-3" /> SDG {sdg.id}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{goal.title}</h1>
                        </div>

                        <Link href="/goals"
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Goals</span>
                        </Link>
                    </div>

                    {/* ── Description ── */}
                    <div className="show-section rounded-2xl border border-border bg-card p-6 shadow-sm" style={{ animationDelay: '40ms' }}>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{goal.description}</p>
                    </div>

                    {/* ── Stat strip ── */}
                    <div className="show-section grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '80ms' }}>
                        {[
                            { label: 'Status', value: goal.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), color: 'bg-primary text-primary-foreground' },
                            { label: 'Type', value: `${goal.type} Term`, color: 'bg-secondary text-secondary-foreground' },
                            { label: 'Tasks', value: `${tasks.length}`, color: 'bg-card border border-border text-foreground' },
                            { label: 'Compliance', value: `${progressPct}%`, color: progressPct >= 100 ? 'bg-primary text-primary-foreground' : 'bg-accent/10 text-accent border border-accent/20' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`flex flex-col gap-0.5 rounded-xl p-4 ${color}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
                                <p className="text-lg font-extrabold">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Detail grid ── */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* Project Manager */}
                        <Section icon={Users} title="Project Manager" delay={100}>
                            <div className="flex items-center gap-3">
                                <Avatar name={goal.project_manager?.name ?? 'N/A'} avatar={goal.project_manager?.avatar} />
                                <span className="text-sm font-semibold text-foreground">{goal.project_manager?.name ?? 'Not assigned'}</span>
                            </div>
                        </Section>

                        {/* Progress */}
                        <Section icon={TrendingUp} title="Progress" delay={120}>
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Compliance</span>
                                    <span className="font-black text-foreground">{progressPct}%</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                                    <div className="progress-bar h-full rounded-full bg-primary"
                                        style={{ '--pw': `${progressPct}%` } as React.CSSProperties} />
                                </div>
                                <Progress value={progressPct} className="mt-2 h-1.5 opacity-0" />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {progressPct >= 100 ? 'Goal completed.' : progressPct > 50 ? 'More than halfway there.' : 'In progress.'}
                                </p>
                            </div>
                        </Section>

                        {/* Timeline */}
                        <Section icon={CalendarDays} title="Timeline" delay={140}>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Start</span>
                                    <span className="font-semibold text-foreground">{fmtFull(goal.start_date)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">End</span>
                                    <span className="font-semibold text-foreground">{fmtFull(goal.end_date)}</span>
                                </div>
                                <div className="h-px bg-border" />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-semibold text-foreground">{durationLabel(goal.start_date, goal.end_date)}</span>
                                </div>
                            </div>
                        </Section>

                        {/* Assigned Committee */}
                        {/* <Section icon={Users} title="Assigned Committee" delay={160}
                            action={
                                <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-secondary-foreground">
                                    {assignedUsers.length}
                                </span>
                            }
                        >
                            {assignedUsers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {assignedUsers.map(user => (
                                        <div key={user.id}
                                            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm">
                                            <Avatar name={user.name} avatar={user.avatar} size="sm" />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
                                                <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">No committee members assigned.</p>
                            )}
                        </Section> */}
                    </div>

                    {/* ── SDG Assignments section ── */}
                    {sdgs.length > 0 && (
                        <Section icon={Target} title="Assigned SDGs" delay={180}
                            action={
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-secondary-foreground">
                                        {sdgs.length} SDG{sdgs.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            }
                        >
                            {/* Tab Navigation */}
                            <div className="border-b border-border">
                                <div className="flex flex-wrap gap-1">
                                    {sdgs.map((sdg, idx) => (
                                        <button
                                            key={sdg.id}
                                            onClick={() => setActiveSdgTab(sdg.id)}
                                            className={`
                                                relative inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all
                                                ${activeSdgTab === sdg.id
                                                    ? 'bg-primary/10 text-primary shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }
                                            `}
                                        >
                                            {/* <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary">
                                                {sdg.id}
                                            </div> */}
                                            <span className="hidden sm:inline">{sdg.name.length > 20 ? sdg.name.substring(0, 20) + '...' : sdg.name}</span>
                                            <span className="sm:hidden">SDG {sdg.id}</span>
                                            {sdg.users && sdg.users.length > 0 && (
                                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground">
                                                    {sdg.users.length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[300px]">
                                {sdgs.map((sdg) => (
                                    <div
                                        key={sdg.id}
                                        className={`transition-all duration-300 ${activeSdgTab === sdg.id ? 'block animate-in fade-in-0 slide-in-from-top-4' : 'hidden'
                                            }`}
                                    >
                                        {/* SDG Header Info */}
                                        <div className="mb-4 rounded-lg bg-primary/5 p-4">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-foreground">{sdg.name}</h3>
                                                    {sdg.description && (
                                                        <p className="mt-1 text-sm text-muted-foreground">{sdg.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        SDG {sdg.id}
                                                    </span>
                                                    {sdg.users && sdg.users.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                                                            <Users className="h-3 w-3" />
                                                            {sdg.users.length} Staff
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Staff assigned to this SDG */}
                                        {sdg.users && sdg.users.length > 0 ? (
                                            <div>
                                                <div className="mb-3 flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        Assigned Staff
                                                    </p>
                                                    <button
                                                        onClick={() => setExpandedSdg(sdg.id)}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        {expandedSdg === sdg.id ? 'Show less' : `Show all (${sdg.users.length})`}
                                                    </button>
                                                </div>
                                                <div className={`grid gap-3 transition-all duration-300 ${expandedSdg === sdg.id
                                                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                                    : 'grid-cols-1 sm:grid-cols-2'
                                                    }`}>
                                                    {(expandedSdg === sdg.id ? sdg.users : sdg.users.slice(0, 4)).map(user => (
                                                        <div key={user.id}
                                                            className="flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm">
                                                            <Avatar name={user.name} avatar={user.avatar} size="sm" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                                                                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {expandedSdg !== sdg.id && sdg.users.length > 4 && (
                                                    <div className="mt-3 text-center">
                                                        <button
                                                            onClick={() => setExpandedSdg(sdg.id)}
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            + {sdg.users.length - 4} more staff members
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
                                                <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-sm font-medium text-muted-foreground">No staff assigned to this SDG</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Staff members assigned to this goal will appear here when they're linked to this SDG
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* ── Tasks ── */}
                    <Section icon={Flag} title="Tasks" delay={200}
                        action={
                            <PermissionGuard permission="create task" fallback={null}>
                                <Link href={TaskController.create({ goal: goal.slug }).url}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                    <Plus className="h-3.5 w-3.5" /> Add Task
                                </Link>
                            </PermissionGuard>
                        }
                    >
                        {/* Filter pills */}
                        {tasks.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
                                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                {TASK_FILTERS.map(({ key, label }) => (
                                    <button key={key} type="button" onClick={() => setTaskFilter(key)}
                                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95
                                            ${taskFilter === key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
                                <Flag className="mb-3 h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-semibold text-muted-foreground">No tasks yet</p>
                                <PermissionGuard permission="create task" fallback={null}>
                                    <Link href={TaskController.create({ goal: goal.slug }).url}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95">
                                        <Plus className="h-3.5 w-3.5" /> Add First Task
                                    </Link>
                                </PermissionGuard>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center">
                                <Filter className="mb-2 h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No tasks match this filter.</p>
                                <button onClick={() => setTaskFilter('all')}
                                    className="mt-3 rounded-xl border-2 border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95">
                                    Clear Filter
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTasks.map(task => (
                                    <TaskItem key={task.id} task={task} goalSlug={goal.slug} />
                                ))}
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </AppLayout>
    );
}