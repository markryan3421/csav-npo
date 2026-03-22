import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { ArrowLeft, LoaderCircle, Flag, Calendar as CalendarIcon, Clock, Users, RefreshCw } from 'lucide-react';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import { useState, useEffect } from 'react';
import { toast } from '@/components/custom-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import GoalController from '@/actions/App/Http/Controllers/GoalController';

interface Sdg { id: number; name: string; slug: string; }
interface User { id: number; name: string; email: string; }
interface Goal {
    id: number; slug: string; title: string; description: string;
    type: string; start_date: string; end_date: string; status: string;
}
interface AuthUser { id: number; name: string; }

interface Props {
    sdg: Sdg;
    goal: Goal;
    assignedUserIds: number[];
    staffUsers: User[];
    authUser: AuthUser;
}

interface FormData {
    title: string;
    description: string;
    project_manager_id: number;
    sdg_id: number;
    start_date: string;
    end_date: string;
    type: string;
    assigned_users: number[];
}

function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; index?: number;
}) {
    return (
        <div
            className="form-section space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}
        >
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

const timeFromISO = (iso: string) => {
    try { return format(parseISO(iso), 'HH:mm'); } catch { return '08:00'; }
};

export default function EditGoal({ sdg, goal, assignedUserIds, staffUsers, authUser }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: `/${sdg.slug}/goals` },
        { title: goal.title, href: `/${sdg.slug}/goals/${goal.slug}/edit` },
    ];

    const { data, setData, put, errors, processing } = useForm<FormData>({
        title: goal.title,
        description: goal.description,
        project_manager_id: authUser.id,
        sdg_id: sdg.id,
        start_date: goal.start_date,
        end_date: goal.end_date,
        type: goal.type,
        assigned_users: assignedUserIds,
    });

    const [startDate, setStartDate] = useState<Date | undefined>(
        goal.start_date ? parseISO(goal.start_date) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        goal.end_date ? parseISO(goal.end_date) : undefined
    );
    const [startTime, setStartTime] = useState(timeFromISO(goal.start_date));
    const [endTime, setEndTime] = useState(timeFromISO(goal.end_date));
    const [startOpen, setStartOpen] = useState(false);
    const [endOpen, setEndOpen] = useState(false);

    useEffect(() => {
        if (startDate) {
            const [h, m] = startTime.split(':');
            const dt = new Date(startDate);
            dt.setHours(parseInt(h), parseInt(m), 0);
            setData('start_date', dt.toISOString());
        }
    }, [startDate, startTime]);

    useEffect(() => {
        if (endDate) {
            const [h, m] = endTime.split(':');
            const dt = new Date(endDate);
            dt.setHours(parseInt(h), parseInt(m), 0);
            setData('end_date', dt.toISOString());
        }
    }, [endDate, endTime]);

    const toggleUser = (userId: number, checked: boolean) => {
        setData('assigned_users',
            checked
                ? [...data.assigned_users, userId]
                : data.assigned_users.filter((id) => id !== userId)
        );
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(GoalController.update({ goal: goal.slug }).url, {
            onSuccess: () => toast.success('Goal updated successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${goal.title}`} />
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
                                <RefreshCw className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    {sdg.name}
                                </p>
                                <h1 className="line-clamp-1 text-xl font-extrabold tracking-tight text-foreground">
                                    {goal.title}
                                </h1>
                            </div>
                        </div>

                        <Link
                            as="button"
                            href={`/${sdg.slug}/goals`}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-200
                                       active:scale-95 hover:bg-primary hover:text-primary-foreground hover:shadow-md
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Goals</span>
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-5">

                        {/* 1. Goal Information */}
                        <FormSection icon={Flag} title="Goal Information" index={0}>
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Title
                                </Label>
                                <Input
                                    id="title" value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Reduce carbon emissions by 20%"
                                    autoFocus tabIndex={1} disabled={processing}
                                    className="h-11 rounded-xl border-2 transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Description
                                </Label>
                                <CustomTextarea
                                    id="description" value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe the goal's objectives..."
                                    rows={4} tabIndex={2} disabled={processing}
                                    className="rounded-xl border-2 px-4 py-3 text-sm transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Goal Type
                                </Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)} disabled={processing}>
                                    <SelectTrigger className="h-11 rounded-xl border-2 transition-all focus:border-primary">
                                        <SelectValue placeholder="Select goal type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="long">Long-Term Goal</SelectItem>
                                            <SelectItem value="short">Short-Term Goal</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>
                        </FormSection>

                        {/* 2. Timeline */}
                        <FormSection icon={CalendarIcon} title="Timeline" index={1}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Start */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">
                                        <span className="text-accent">* </span>Start Date
                                    </Label>
                                    <Popover open={startOpen} onOpenChange={setStartOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl border-2 font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={startDate} captionLayout="dropdown"
                                                onSelect={(d) => { setStartDate(d); setStartOpen(false); }} />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                                            step="60" disabled={processing}
                                            className="h-9 rounded-xl border-2 text-sm focus:border-primary" />
                                    </div>
                                    <InputError message={errors.start_date} />
                                </div>

                                {/* End */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">
                                        <span className="text-accent">* </span>End Date
                                    </Label>
                                    <Popover open={endOpen} onOpenChange={setEndOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl border-2 font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate} captionLayout="dropdown"
                                                disabled={(d) => startDate ? d < startDate : false}
                                                onSelect={(d) => { setEndDate(d); setEndOpen(false); }} />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                                            step="60" disabled={processing}
                                            className="h-9 rounded-xl border-2 text-sm focus:border-primary" />
                                    </div>
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>
                        </FormSection>

                        {/* 3. Team Assignment */}
                        <FormSection icon={Users} title="Assign Team Members" index={2}>
                            {staffUsers.length === 0 ? (
                                <p className="py-2 text-sm text-muted-foreground">
                                    No other members are assigned to <strong>{sdg.name}</strong> yet.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {staffUsers.map((user) => {
                                        const checked = data.assigned_users.includes(user.id);
                                        return (
                                            <label
                                                key={user.id}
                                                htmlFor={`user-${user.id}`}
                                                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all duration-150
                                                    ${checked
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/40'
                                                    }`}
                                            >
                                                <Checkbox
                                                    id={`user-${user.id}`} checked={checked}
                                                    onCheckedChange={(c) => toggleUser(user.id, !!c)}
                                                    disabled={processing}
                                                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                                />
                                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                                                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                {checked && (
                                                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-secondary-foreground">
                                                        Assigned
                                                    </span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            <InputError message={errors.assigned_users as string} />
                        </FormSection>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                <span className="text-accent">*</span> Required fields
                            </p>
                            <button
                                type="submit" disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                           active:scale-95 hover:brightness-110 hover:shadow-lg
                                           disabled:cursor-not-allowed disabled:opacity-60
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {processing ? 'Updating…' : 'Update Goal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}