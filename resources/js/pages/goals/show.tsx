import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ArrowLeft, Target, Flag, Users, CalendarDays, TrendingUp,
    ChevronDown, Plus, Pencil, Trash2, CheckCircle2,
    XCircle, Clock, AlertCircle, RotateCcw, FileText,
    ExternalLink, MoreVertical, Filter,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';
import TaskController from '@/actions/App/Http/Controllers/TaskController';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskProductivityFile {
    id: number;
    file_name: string;
    file_path: string;
}

interface TaskProductivity {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | string;
    remarks?: string | null;
    created_at: string;
    user: { id: number; name: string; avatar?: string | null; };
    task_productivity_files: TaskProductivityFile[];
}

interface Task {
    id: number;
    slug: string;
    title: string;
    description: string;
    deadline: string | null;
    status: string;
    created_at: string;
    task_productivities?: TaskProductivity[];
}

interface Goal {
    id: number;
    slug: string;
    title: string;
    description: string;
    status: string;
    type: string;
    start_date: string;
    end_date: string;
    compliance_percentage: number;
    sdg: { id: number; name: string; };
    projectManager: { id: number; name: string; avatar?: string | null; } | null;
    assigned_users: { id: number; name: string; email: string; avatar?: string | null; }[];
    tasks: Task[];
}

interface ShowProps {
    goal: Goal;
    authUserRole: string;
    authUserId: number;
}

interface FormData {
    status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(d).toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });

const fmtFull = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

function deadlineInfo(deadline: string | null): { label: string; color: string } {
    if (!deadline) return { label: 'No deadline', color: 'text-muted-foreground' };
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.floor((end.getTime() - now.getTime()) / 86400000);
    if (diff > 1) return { label: `${diff}d left`, color: 'text-green-600 dark:text-green-400' };
    if (diff === 1) return { label: '1 day left', color: 'text-yellow-600 dark:text-yellow-400' };
    if (diff === 0) return { label: 'Due today', color: 'text-orange-500' };
    return { label: 'Overdue', color: 'text-accent' };
}

function durationLabel(start: string, end: string): string {
    const days = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    const now = new Date();
    const endDate = new Date(end);
    const startDate = new Date(start);
    if (endDate < now) return `${days} days (Completed)`;
    if (startDate > now) {
        const startsIn = Math.ceil((startDate.getTime() - now.getTime()) / 86400000);
        return `${days} days (Starts in ${startsIn}d)`;
    }
    const endsIn = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
    return `${days} days (Ends in ${endsIn}d)`;
}

// ── Status badge config ───────────────────────────────────────────────────────
const TASK_STATUS_CONFIG: Record<string, { label: string; badge: string; }> = {
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
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
}

function GoalStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-secondary text-secondary-foreground',
        'in-progress': 'bg-primary/10 text-primary border border-primary/20',
        completed: 'bg-primary text-primary-foreground',
    };
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {status.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
    );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, action }: {
    icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
    return (
        <div className="show-section space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
    const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-9 w-9 text-xs';
    return avatar ? (
        <img src={`/storage/${avatar}`} alt={name} className={`${sz} shrink-0 rounded-full object-cover ring-2 ring-primary/20`} />
    ) : (
        <div className={`${sz} shrink-0 flex items-center justify-center rounded-full bg-primary font-black text-primary-foreground`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ── Task item ─────────────────────────────────────────────────────────────────
function TaskItem({ task, goalSlug, isAdminOrManager, authUserId }: {
    task: Task; goalSlug: string; isAdminOrManager: boolean; authUserId: number;
}) {
    const [open, setOpen] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');
    const dl = deadlineInfo(task.deadline);

    const submissions = task.task_productivities ?? [];
    const submissionCount = submissions.length;

    console.log(submissions);

    const handleApproveResubmission = () => {
        router.put(`/tasks/${task.slug}/approve-resubmission`, { deadline: newDeadline }, {
            onSuccess: () => setExtendOpen(false),
        });
    };

    const handleApproveSubmission = (submissionId: number) => {
        router.put(TaskProductivityController.approveSubmission(submissionId).url, {
            preserveScroll: true,
        });
    };

    const handleRejectResubmission = () => {
        router.put(`/tasks/${task.slug}/reject-resubmission`);
    };

    const handleRequestResubmission = () => {
        router.put(TaskProductivityController.requestResubmission({ task: task.slug }).url);
    };

    const handleDeleteTask = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            router.delete(`/goals/${goalSlug}/tasks/${task.slug}`);
        }
    };

    return (
        <div className="task-item overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">

            {/* Task header — clickable to expand */}
            <div
                className="flex cursor-pointer items-center justify-between gap-3 bg-muted/30 px-5 py-3.5 transition-colors hover:bg-muted/50"
                onClick={() => setOpen((v) => !v)}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
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
                                <span className={`flex items-center gap-1 ${dl.color}`}>
                                    <Clock className="h-3 w-3" />
                                    {dl.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: status + actions */}
                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <TaskStatusBadge status={task.status} />

                    {/* Task action buttons based on status */}
                    {task.status === 'pending' && (
                        task.deadline && new Date() < new Date(task.deadline) ? (
                            <Link
                                href={`/tasks/${task.slug}/submit`}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                            >
                                Submit
                            </Link>
                        ) : (
                            <button
                                onClick={handleRequestResubmission}
                                className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-secondary-foreground transition-all hover:brightness-110 active:scale-95"
                            >
                                <RotateCcw className="h-3 w-3" /> Request Resubmission
                            </button>
                        )
                    )}

                    {task.status === 'resubmission_requested' && isAdminOrManager && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setExtendOpen(true)}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                            >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                            </button>
                            <button
                                onClick={handleRejectResubmission}
                                className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1.5 text-[11px] font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
                            >
                                <XCircle className="h-3 w-3" /> Reject
                            </button>
                        </div>
                    )}

                    {task.status === 'resubmission_requested' && !isAdminOrManager && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] text-primary">
                            <Clock className="h-3 w-3" /> Pending approval
                        </span>
                    )}

                    {task.status === 'approved_resubmission' && (
                        <Link
                            href={`/tasks/${task.slug}/late-resubmit`}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                        >
                            Submit Now
                        </Link>
                    )}

                    {task.status === 'rejected_resubmission' && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] text-accent">
                            <XCircle className="h-3 w-3" /> Resubmission rejected
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

                    {/* Admin/Manager more menu */}
                    {isAdminOrManager && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary hover:text-primary">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem asChild>
                                    <Link href={`/goals/${goalSlug}/tasks/${task.slug}/edit`} className="flex items-center gap-2 text-sm">
                                        <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDeleteTask}
                                    className="flex items-center gap-2 text-sm text-accent focus:text-accent"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Task body — collapsible */}
            {open && (
                <div className="space-y-5 p-5">

                    {/* Description */}
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {task.description}
                    </p>

                    {/* Task detail mini-cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {/* Due date */}
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</p>
                            {task.deadline ? (
                                <>
                                    <p className="text-sm font-bold text-foreground">{fmt(task.deadline)}</p>
                                    <p className={`mt-1 text-xs font-semibold ${dl.color}`}>{dl.label}</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Not set</p>
                            )}
                        </div>

                        {/* Created */}
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Created</p>
                            <p className="text-sm font-bold text-foreground">{fmt(task.created_at)}</p>
                        </div>

                        {/* Submissions */}
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submissions</p>
                            <p className="text-3xl font-extrabold text-foreground">{submissionCount}</p>
                            {submissionCount > 0 && (() => {
                                const approved = submissions.filter((s) => s.status === 'approved').length;
                                const rate = Math.round((approved / submissionCount) * 100);
                                return (
                                    <div className="mt-1">
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rate}%` }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-muted-foreground">{approved} approved · {rate}% rate</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Submissions list */}
                    {submissionCount > 0 && (
                        <div className="space-y-3 border-t border-border pt-5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Submissions</p>
                            {submissions.map((sub) => (
                                <div key={sub.id} className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <Avatar name={sub.user?.name ?? 'U'} avatar={sub.user?.avatar} size="md" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {sub.user?.name ?? 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>

                                                {/* Files */}
                                                {sub.task_productivity_files?.length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-medium text-muted-foreground">Submitted Files</p>
                                                        <div className="mt-2 space-y-2">
                                                            {sub.task_productivity_files.map((file) => (
                                                                <div key={file.id} className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-sm text-foreground">{file.file_name}</span>
                                                                    </div>
                                                                    <a
                                                                        href={`/storage/${file.file_path}`}
                                                                        target="_self"
                                                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        Open
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Rejection remarks */}
                                                {sub.status === 'rejected' && sub.remarks && (
                                                    <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
                                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-accent">Rejection Remarks</p>
                                                        <p className="text-xs text-foreground">{sub.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submission action buttons (admin/manager) */}
                                        {isAdminOrManager && (
                                            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                                {sub.status === 'approved' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                                                    </span>
                                                ) : sub.status === 'rejected' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                                                        <XCircle className="h-3.5 w-3.5" /> Rejected
                                                    </span>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApproveSubmission(sub.id)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                        </button>
                                                        <Link
                                                            href={TaskProductivityController.rejectSubmissionForm(sub.id).url}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Reject
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Staff: resubmit button */}
                                        {sub.status === 'rejected' && (
                                            <Link
                                                href={TaskProductivityController.resubmitForm({ task: task.slug, task_productivity: sub.id }).url}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground transition-all hover:brightness-110 active:scale-95"
                                            >
                                                <RotateCcw className="h-3.5 w-3.5" /> Resubmit
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {submissionCount === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center">
                            <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No submissions yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Extend deadline modal */}
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
                            Approve resubmission and set a new deadline.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="new-deadline" className="text-sm font-semibold">
                                <span className="text-accent">* </span>New Deadline Date
                            </Label>
                            <Input
                                id="new-deadline"
                                type="date"
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                                className="h-11 rounded-xl border-2 focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                            />
                            <p className="text-xs text-muted-foreground">Select a future date to extend the deadline</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleApproveResubmission}
                                disabled={!newDeadline}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 active:scale-95"
                            >
                                <CheckCircle2 className="h-4 w-4" /> Approve & Extend
                            </button>
                            <button
                                onClick={() => setExtendOpen(false)}
                                className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── TASK FILTER KEYS ──────────────────────────────────────────────────────────
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

// Normalise task status for filter matching
function normStatus(s: string) {
    return s === 'completed' ? 'approved' : s;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShowGoal({ goal, authUserRole, authUserId }: ShowProps) {
    const roleValue = Array.isArray(authUserRole)
        ? (authUserRole[0] ?? 'staff')
        : authUserRole;
    const isAdminOrManager = roleValue === 'admin' || roleValue === 'project-manager';
    const [taskFilter, setTaskFilter] = useState('all');

    const tasks = goal.tasks ?? [];
    const assignedUsers = goal.assigned_users ?? [];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        { title: goal.title, href: `/goals/${goal.slug}` },
    ];

    const filteredTasks = useMemo(() =>
        taskFilter === 'all'
            ? tasks
            : tasks.filter((t) => normStatus(t.status) === taskFilter),
        [tasks, taskFilter]
    );

    const progressPct = Math.min(100, Math.max(0, goal.compliance_percentage ?? 0));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={goal.title} />

            <style>{`
                @keyframes showReveal {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .show-section {
                    animation: showReveal 0.4s cubic-bezier(0.22,1,0.36,1) both;
                }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .show-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes progressFill {
                    from { width: 0%; }
                    to   { width: var(--progress-width); }
                }
                .progress-bar { animation: progressFill 1s cubic-bezier(0.22,1,0.36,1) 0.5s both; }
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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                                    <Target className="h-3 w-3" />
                                    SDG {goal.sdg?.id}
                                </span>
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                {goal.title}
                            </h1>
                        </div>

                        <Link
                            href="/goals"
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Goals</span>
                        </Link>
                    </div>

                    {/* ── Description ── */}
                    <div className="show-section rounded-2xl border border-border bg-card p-6 shadow-sm" style={{ animationDelay: '40ms' }}>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</p>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{goal.description}</p>
                    </div>

                    {/* ── Detail grid ── */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* SDG */}
                        <Section icon={Target} title="SDG">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-black text-primary-foreground">
                                    {goal.sdg?.id ?? '?'}
                                </div>
                                <span className="text-sm font-semibold text-foreground">{goal.sdg?.name ?? 'Not assigned'}</span>
                            </div>
                        </Section>

                        {/* Project Manager */}
                        <Section icon={Users} title="Project Manager">
                            <div className="flex items-center gap-3">
                                <Avatar name={goal.projectManager?.name ?? 'N/A'} avatar={goal.projectManager?.avatar} />
                                <span className="text-sm font-semibold text-foreground">
                                    {goal.projectManager?.name ?? 'Not assigned'}
                                </span>
                            </div>
                        </Section>

                        {/* Timeline */}
                        <Section icon={CalendarDays} title="Timeline">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Start Date</span>
                                    <span className="font-semibold text-foreground">{fmtFull(goal.start_date)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">End Date</span>
                                    <span className="font-semibold text-foreground">{fmtFull(goal.end_date)}</span>
                                </div>
                                <div className="mt-1 h-px bg-border" />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-semibold text-foreground">{durationLabel(goal.start_date, goal.end_date)}</span>
                                </div>
                            </div>
                        </Section>

                        {/* Progress */}
                        <Section icon={TrendingUp} title="Progress">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Completion</span>
                                    <span className="font-black text-foreground">{progressPct}%</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                                    <div
                                        className="progress-bar h-full rounded-full bg-primary"
                                        style={{ '--progress-width': `${progressPct}%` } as React.CSSProperties}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {progressPct === 100 ? 'Goal completed.' : progressPct > 50 ? 'More than halfway there.' : 'In progress.'}
                                </p>
                            </div>
                        </Section>
                    </div>

                    {/* ── Assigned Committee ── */}
                    <Section
                        icon={Users}
                        title="Assigned Committee"
                        action={
                            <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-secondary-foreground">
                                {assignedUsers.length}
                            </span>
                        }
                    >
                        {assignedUsers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {assignedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                                    >
                                        <Avatar name={user.name} avatar={user.avatar} size="sm" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">No committee members assigned.</p>
                        )}
                    </Section>

                    {/* ── Tasks ── */}
                    <Section
                        icon={Flag}
                        title="Tasks"
                        action={
                            isAdminOrManager ? (
                                <Link
                                    href={TaskController.create({ goal: goal.slug }).url}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Add Task
                                </Link>
                            ) : undefined
                        }
                    >
                        {/* Filter pills */}
                        {tasks.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-4">
                                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                {TASK_FILTERS.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTaskFilter(key)}
                                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95
                                            ${taskFilter === key
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Task list */}
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
                                <Flag className="mb-3 h-10 w-10 text-muted-foreground/30" />
                                <p className="text-sm font-semibold text-muted-foreground">No tasks yet</p>
                                {isAdminOrManager && (
                                    <Link
                                        href={TaskController.create({ goal: goal.slug }).url}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add First Task
                                    </Link>
                                )}
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center">
                                <Filter className="mb-2 h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No tasks match this filter.</p>
                                <button
                                    onClick={() => setTaskFilter('all')}
                                    className="mt-3 rounded-xl border-2 border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                >
                                    Clear Filter
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTasks.map((task) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        goalSlug={goal.slug}
                                        isAdminOrManager={isAdminOrManager}
                                        authUserId={authUserId}
                                    />
                                ))}
                            </div>
                        )}
                    </Section>

                </div>
            </div>
        </AppLayout>
    );
}