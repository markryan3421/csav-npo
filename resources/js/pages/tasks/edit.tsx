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
import { format, isBefore, isAfter, startOfDay, differenceInDays } from 'date-fns';
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

    const isDateDisabled = (date: Date) =>
        isBefore(date, today) || isAfter(date, goalEnd);

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

                    {/* Goal context card — navy header */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-[#1d4791] px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Goal</p>
                                <p className="text-sm font-semibold text-white truncate max-w-xs mt-0.5">{goal.title}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Days Remaining</p>
                                <p className="text-xl font-semibold text-white mt-0.5">{daysRemaining}d</p>
                            </div>
                        </div>
                        <div className="bg-white px-5 py-3 flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-[#1d4791] shrink-0" />
                            <span>Goal deadline: <span className="font-semibold text-slate-700">{format(goalEnd, 'MMMM d, yyyy')}</span> — task deadline must fall within this window.</span>
                        </div>
                    </div>

                    {/* Main form card */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-[#1d4791] px-5 py-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-base font-semibold text-white tracking-tight">Edit Task</h1>
                                <p className="text-xs text-white/60 mt-0.5">Update task details below.</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-2 shrink-0">
                                <Save className="h-4 w-4 text-white" />
                            </div>
                        </div>

                        <div className="bg-white px-5 py-5">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* Title */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Task Title <span className="text-[#d85e39]">*</span>
                                    </p>
                                    <Input
                                        id="task-title"
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        placeholder="Enter a clear and specific task title..."
                                        className="h-10 rounded-lg border-slate-200 text-sm focus:border-[#1d4791] focus:ring-1 focus:ring-[#1d4791]"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                        Description
                                    </p>
                                    <CustomTextarea
                                        id="task-description"
                                        rows={5}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Provide a detailed description of what needs to be done..."
                                        className="w-full resize-none rounded-lg border-slate-200 text-sm focus:border-[#1d4791] focus:ring-1 focus:ring-[#1d4791]"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Due Date */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <CalendarIcon className="h-3.5 w-3.5 text-[#1d4791]" />
                                        Timeline &amp; Deadline
                                    </p>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Due Date</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-all
                                                        hover:border-[#1d4791]/40 focus:outline-none focus:ring-1 focus:ring-[#1d4791] focus:border-[#1d4791]"
                                                >
                                                    <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                                    {date
                                                        ? <span>{format(date, 'PPP')}</span>
                                                        : <span className="text-slate-400">Select task due date</span>
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
                                                    className="[&_.rdp-day_selected]:bg-[#1d4791] [&_.rdp-day_selected]:text-white"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.deadline} />
                                    </div>

                                    <div className="flex items-start gap-2 text-xs text-slate-500">
                                        <AlertCircle className="h-3.5 w-3.5 text-[#1d4791] shrink-0 mt-0.5" />
                                        <span>
                                            Must be completed before goal deadline:{' '}
                                            <span className="font-semibold text-slate-700">{format(goalEnd, 'MMMM d, yyyy')}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Editing tips */}
                                <div className="rounded-lg border border-[#1d4791]/10 bg-[#1d4791]/5 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1d4791] mb-2">Editing Tips</p>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        <li className="flex items-start gap-1.5"><span className="text-[#1d4791] mt-0.5">•</span>Update deadlines carefully – they affect task priority.</li>
                                        <li className="flex items-start gap-1.5"><span className="text-[#1d4791] mt-0.5">•</span>Ensure the new deadline falls within the goal's timeline.</li>
                                        <li className="flex items-start gap-1.5"><span className="text-[#1d4791] mt-0.5">•</span>Clear descriptions help assignees understand expectations.</li>
                                    </ul>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <Link
                                            href={`/goals/${goal.slug}`}
                                            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-white shadow-sm shadow-[#1d4791]/20 transition-all
                                                bg-[#1d4791] hover:bg-[#1d4791]/90
                                                disabled:opacity-50 disabled:cursor-not-allowed"
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