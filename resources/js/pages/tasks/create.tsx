import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { CalendarIcon, ArrowLeft, Flag, LoaderCircle, Info, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { CustomTextarea } from '@/components/ui/custom-textarea';

interface Goal { id: number; slug: string; title: string; end_date: string; }
interface CreateTaskProps { goal: Goal; }

function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; index?: number;
}) {
    return (
        <div className="form-section space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}>
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function Create({ goal }: CreateTaskProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '', description: '', deadline: '',
    });

    const [date, setDate]   = useState<Date | undefined>();
    const [open, setOpen]   = useState(false);

    const today   = startOfDay(new Date());
    const goalEnd = new Date(goal.end_date);
    const daysLeft = Math.max(0, Math.ceil((goalEnd.getTime() - new Date().getTime()) / 86400000));

    const isDisabled = (d: Date) => isBefore(d, today) || isAfter(d, goalEnd);

    const handleDateSelect = (d: Date | undefined) => {
        setDate(d);
        setData('deadline', d ? format(d, 'yyyy-MM-dd') : '');
        setOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/goals/${goal.slug}/tasks`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        { title: goal.title, href: `/goals/${goal.slug}` },
        { title: 'Add Task', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <Flag className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {goal.title}
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Create Task</h1>
                            </div>
                        </div>
                        <Link
                            href={`/goals/${goal.slug}`}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>

                    {/* Goal timeline summary */}
                    <div className="form-section mb-5 flex items-center justify-between rounded-2xl border border-border bg-primary/5 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                                <CalendarDays className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goal Deadline</p>
                                <p className="text-sm font-bold text-foreground">{format(goalEnd, 'MMMM d, yyyy')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Days Remaining</p>
                            <p className={`text-lg font-extrabold ${daysLeft <= 7 ? 'text-accent' : 'text-primary'}`}>
                                {daysLeft}d
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Task info */}
                        <FormSection icon={Flag} title="Task Information" index={0}>
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Task Title
                                </Label>
                                <Input
                                    id="title" value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required placeholder="Enter a clear, specific task title…" disabled={processing}
                                    className="h-11 rounded-xl border-2 transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                <CustomTextarea
                                    id="description" rows={5} value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    disabled={processing}
                                    placeholder="Describe the task objectives, requirements, and expected deliverables…"
                                    className="w-full resize-none rounded-xl border-2 px-4 py-3 text-sm transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                />
                                <InputError message={errors.description} />
                            </div>
                        </FormSection>

                        {/* Deadline */}
                        <FormSection icon={CalendarDays} title="Deadline" index={1}>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Due Date
                                </Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button" variant="outline"
                                            className="h-11 w-full justify-start rounded-xl border-2 font-normal transition-all hover:border-primary"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {date ? format(date, 'PPP') : <span className="text-muted-foreground">Select task due date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single" selected={date} captionLayout="dropdown"
                                            onSelect={handleDateSelect} disabled={isDisabled} initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.deadline} />
                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-sm">
                                <Info className="h-4 w-4 shrink-0 text-primary" />
                                <span className="text-muted-foreground">
                                    Task deadline must be on or before the goal deadline:{' '}
                                    <strong className="text-foreground">{format(goalEnd, 'MMMM d, yyyy')}</strong>
                                </span>
                            </div>
                        </FormSection>

                        {/* Tips */}
                        <FormSection icon={Info} title="Tips for Effective Tasks" index={2}>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {[
                                    'Make tasks specific and actionable with clear objectives',
                                    'Set realistic deadlines that align with your goal timeline',
                                    'Include measurable outcomes to track progress effectively',
                                    'Prioritize tasks based on importance and dependencies',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </FormSection>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                <span className="text-accent">*</span> Required fields
                            </p>
                            <div className="flex gap-3">
                                <Link
                                    href={`/goals/${goal.slug}`}
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit" disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                               active:scale-95 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? 'Creating…' : 'Create Task'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}