import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { CalendarIcon, Save, Clock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import TaskController from '@/actions/App/Http/Controllers/TaskController';
import { toast } from 'sonner';

interface Goal {
    id: number;
    slug: string;
    title: string;
    end_date: string;
}

interface Task {
    id: number;
    slug: string;
    title: string;
    description: string;
    deadline: string | null;
}

interface EditTaskProps {
    goal: Goal;
    task: Task;
}

export default function Edit({ goal, task }: EditTaskProps) {
    const { data, setData, put, processing, errors } = useForm({
        title: task.title,
        description: task.description,
        deadline: task.deadline ?? '',
        _method: 'PUT',
    });

    const [date, setDate] = useState<Date | undefined>(
        task.deadline ? new Date(task.deadline) : undefined
    );

    const today = startOfDay(new Date());
    const goalEnd = new Date(goal.end_date);
    const daysRemaining = Math.max(0, Math.ceil((goalEnd.getTime() - Date.now()) / 86400000));

    const isDateDisabled = (d: Date) =>
        isBefore(d, today) || isAfter(d, goalEnd);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setData('deadline', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(TaskController.update({ goal: goal.slug, task: task.slug }).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Task updated successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        { title: goal.title, href: `/goals/${goal.slug}` },
        { title: 'Edit Task', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Task: ${task.title}`} />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-fade-up { animation: formFadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.05) both; }
            `}</style>

            <div className="flex flex-1 flex-col items-center gap-6 p-4 pb-12 md:p-6 md:pb-16">
                <div className="w-full max-w-2xl form-fade-up space-y-4">

                    {/* ── Goal context card ── */}
                    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                        <div className="bg-primary px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/50">
                                    Goal
                                </p>
                                <p className="mt-0.5 truncate text-sm font-semibold text-primary-foreground max-w-xs">
                                    {goal.title}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/50">
                                    Days Remaining
                                </p>
                                <p className="mt-0.5 text-xl font-semibold text-primary-foreground">
                                    {daysRemaining}d
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>
                                Goal deadline:{' '}
                                <span className="font-semibold text-foreground">
                                    {format(goalEnd, 'MMMM d, yyyy')}
                                </span>{' '}
                                — task deadline must fall within this window.
                            </span>
                        </div>
                    </div>

                    {/* ── Main form card ── */}
                    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                        <div className="bg-primary px-5 py-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-base font-semibold tracking-tight text-primary-foreground">
                                    Edit Task
                                </h1>
                                <p className="mt-0.5 text-xs text-primary-foreground/60">
                                    Update task details below.
                                </p>
                            </div>
                            <div className="shrink-0 rounded-lg bg-primary-foreground/10 p-2">
                                <Save className="h-4 w-4 text-primary-foreground" />
                            </div>
                        </div>

                        <div className="bg-card px-5 py-5">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Title */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        Task Title <span className="text-accent">*</span>
                                    </p>
                                    <Input
                                        id="task-title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        placeholder="Enter a clear and specific task title..."
                                        className="h-10 rounded-lg border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        Description
                                    </p>
                                    <CustomTextarea
                                        id="task-description"
                                        rows={5}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Provide a detailed description of what needs to be done..."
                                        className="w-full resize-none rounded-lg border-border text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Due Date */}
                                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                        Timeline &amp; Deadline
                                    </p>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                            Due Date
                                        </p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-all
                                                        hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                >
                                                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    {date
                                                        ? <span>{format(date, 'PPP')}</span>
                                                        : <span className="text-muted-foreground">Select task due date</span>
                                                    }
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={handleDateSelect}
                                                    disabled={isDateDisabled}
                                                    initialFocus
                                                    className="[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.deadline} />
                                    </div>

                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                        <span>
                                            Must be completed before goal deadline:{' '}
                                            <span className="font-semibold text-foreground">
                                                {format(goalEnd, 'MMMM d, yyyy')}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Editing tips */}
                                <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
                                        Editing Tips
                                    </p>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                        <li className="flex items-start gap-1.5">
                                            <span className="mt-0.5 text-primary">•</span>
                                            Update deadlines carefully – they affect task priority.
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="mt-0.5 text-primary">•</span>
                                            Ensure the new deadline falls within the goal's timeline.
                                        </li>
                                        <li className="flex items-start gap-1.5">
                                            <span className="mt-0.5 text-primary">•</span>
                                            Clear descriptions help assignees understand expectations.
                                        </li>
                                    </ul>
                                </div>

                                {/* Actions */}
                                <div className="border-t border-border pt-2">
                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <Link
                                            href={`/goals/${goal.slug}`}
                                            className="inline-flex h-9 items-center justify-center rounded-lg border-2 border-primary bg-card px-4 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all
                                                hover:brightness-110 hover:shadow-lg active:scale-95
                                                disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            {processing ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>

                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}