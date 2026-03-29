import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { ArrowLeft, LoaderCircle, Target, Flag, Calendar as CalendarIcon, Clock, Users, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/components/custom-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import GoalController from '@/actions/App/Http/Controllers/GoalController';

interface Sdg {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    current_sdg_id?: number;
}

interface UserWithSdg extends User {
    sdgName: string;
    sdgId: number;
}

interface AuthUser {
    id: number;
    name: string;
    current_sdg_id?: number;
}

interface Props {
    sdg: Sdg; // Current selected SDG from session
    authUser: AuthUser;
    staffUsers: User[]; // Users from the current SDG (for backward compatibility)
    allSdgs: Sdg[]; // All available SDGs
    usersBySdg: Record<number, User[]>; // Users grouped by SDG
}

interface FormData {
    title: string;
    description: string;
    project_manager_id: number;
    sdg_ids: number[]; // Changed from sdg_id to array
    start_date: string;
    end_date: string;
    type: string;
    assigned_users: number[];
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    index?: number;
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

// ── SDG Selection Component ──────────────────────────────────────────────────
function SdgSelector({ sdgs, selectedSdgs, onToggle, disabled }: {
    sdgs: Sdg[];
    selectedSdgs: number[];
    onToggle: (sdgId: number, checked: boolean) => void;
    disabled: boolean;
}) {
    return (
        <div className="space-y-3">
            <Label className="text-sm font-semibold">
                <span className="text-accent">* </span>Associated SDGs
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sdgs.map((sdg) => {
                    const isSelected = selectedSdgs.includes(sdg.id);
                    return (
                        <label
                            key={sdg.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-150
                                ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/40'
                                }`}
                        >
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => onToggle(sdg.id, !!checked)}
                                disabled={disabled}
                                className="mt-0.5 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary/70" />
                                    <p className="font-semibold text-foreground">{sdg.name}</p>
                                </div>
                                {sdg.description && (
                                    <p className="mt-1 text-xs text-muted-foreground">{sdg.description}</p>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

// ── Collapsible User Section Component ──────────────────────────────────────
function CollapsibleUserSection({ sdgName, sdgId, users, selectedUsers, onToggleUser, disabled }: {
    sdgName: string;
    sdgId: number;
    users: User[];
    selectedUsers: number[];
    onToggleUser: (userId: number, checked: boolean) => void;
    disabled: boolean;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const selectedCount = users.filter(u => selectedUsers.includes(u.id)).length;

    if (users.length === 0) return null;

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-foreground">{sdgName}</span>
                    {selectedCount > 0 && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {selectedCount} selected
                        </span>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">{users.length} members</span>
            </button>
            
            {isOpen && (
                <div className="divide-y divide-border">
                    {users.map((user) => {
                        const checked = selectedUsers.includes(user.id);
                        return (
                            <label
                                key={user.id}
                                className={`flex cursor-pointer items-center gap-3 p-3 transition-all duration-150 hover:bg-muted/30
                                    ${checked ? 'bg-primary/5' : ''}`}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => onToggleUser(user.id, !!c)}
                                    disabled={disabled}
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
                                        Selected
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function CreateGoal({ sdg, authUser, staffUsers, allSdgs, usersBySdg }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: `/${sdg.slug}/goals` },
        { title: 'Create Goal', href: `/${sdg.slug}/goals/create` },
    ];

    const { data, setData, post, errors, processing, reset } = useForm<FormData>({
        title: '',
        description: '',
        project_manager_id: authUser.id,
        sdg_ids: [sdg.id], // Pre-select the current SDG
        start_date: '',
        end_date: '',
        type: '',
        assigned_users: [],
    });

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('17:00');
    const [startOpen, setStartOpen] = useState(false);
    const [endOpen, setEndOpen] = useState(false);

    // Get all users from selected SDGs, grouped by SDG
    const availableUsersBySdg = useMemo(() => {
        const result: Record<number, User[]> = {};
        data.sdg_ids.forEach(sdgId => {
            if (usersBySdg[sdgId]) {
                result[sdgId] = usersBySdg[sdgId];
            }
        });
        return result;
    }, [data.sdg_ids, usersBySdg]);

    // Flatten all available users for validation
    const allAvailableUsers = useMemo(() => {
        return Object.values(availableUsersBySdg).flat();
    }, [availableUsersBySdg]);

    // Remove users that are no longer available when SDGs change
    useEffect(() => {
        const availableUserIds = new Set(allAvailableUsers.map(u => u.id));
        const currentAssignedUsers = data.assigned_users.filter(id => availableUserIds.has(id));
        
        if (currentAssignedUsers.length !== data.assigned_users.length) {
            setData('assigned_users', currentAssignedUsers);
        }
    }, [allAvailableUsers]);

    useEffect(() => {
        if (startDate) {
            const [h, m] = startTime.split(':');
            const dt = new Date(startDate);
            dt.setHours(parseInt(h), parseInt(m), 0);
            setData('start_date', dt.toISOString());
        } else {
            setData('start_date', '');
        }
    }, [startDate, startTime]);

    useEffect(() => {
        if (endDate) {
            const [h, m] = endTime.split(':');
            const dt = new Date(endDate);
            dt.setHours(parseInt(h), parseInt(m), 0);
            setData('end_date', dt.toISOString());
        } else {
            setData('end_date', '');
        }
    }, [endDate, endTime]);

    const toggleSdg = (sdgId: number, checked: boolean) => {
        if (checked) {
            setData('sdg_ids', [...data.sdg_ids, sdgId]);
        } else {
            setData('sdg_ids', data.sdg_ids.filter(id => id !== sdgId));
        }
    };

    const toggleUser = (userId: number, checked: boolean) => {
        setData('assigned_users',
            checked
                ? [...data.assigned_users, userId]
                : data.assigned_users.filter((id) => id !== userId)
        );
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Validate at least one SDG selected
        if (data.sdg_ids.length === 0) {
            toast.error('Please select at least one SDG for this goal.');
            return;
        }

        post(GoalController.store().url, {
            onSuccess: () => { 
                toast.success('Goal created successfully.'); 
                reset();
                setStartDate(undefined);
                setEndDate(undefined);
            },
            onError: () => { 
                toast.error('Please fix the errors below.'); 
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Create Goal — ${sdg.name}`} />
            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <Target className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Multi-SDG Goal
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Create Goal
                                </h1>
                            </div>
                        </div>

                        <Link
                            href={GoalController.index().url}
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
                                    placeholder="Describe the goal's objectives, targets, and success criteria..."
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

                        {/* 2. SDG Association - NEW */}
                        <FormSection icon={Globe} title="SDG Association" index={1}>
                            <SdgSelector
                                sdgs={allSdgs}
                                selectedSdgs={data.sdg_ids}
                                onToggle={toggleSdg}
                                disabled={processing}
                            />
                            {errors.sdg_ids && (
                                <InputError message={errors.sdg_ids as string} />
                            )}
                            {data.sdg_ids.length === 0 && (
                                <p className="text-sm text-accent">Please select at least one SDG for this goal.</p>
                            )}
                        </FormSection>

                        {/* 3. Timeline */}
                        <FormSection icon={CalendarIcon} title="Timeline" index={2}>
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

                        {/* 4. Team Assignment - NEW: Grouped by SDG */}
                        <FormSection icon={Users} title="Assign Team Members" index={3}>
                            {Object.keys(availableUsersBySdg).length === 0 ? (
                                <p className="py-2 text-sm text-muted-foreground">
                                    Select at least one SDG to see available team members.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(availableUsersBySdg).map(([sdgId, users]) => {
                                        const sdg = allSdgs.find(s => s.id === parseInt(sdgId));
                                        return (
                                            <CollapsibleUserSection
                                                key={sdgId}
                                                sdgName={sdg?.name || `SDG ${sdgId}`}
                                                sdgId={parseInt(sdgId)}
                                                users={users}
                                                selectedUsers={data.assigned_users}
                                                onToggleUser={toggleUser}
                                                disabled={processing}
                                            />
                                        );
                                    })}
                                    {allAvailableUsers.length > 0 && (
                                        <div className="mt-3 pt-2 text-right">
                                            <span className="text-xs text-muted-foreground">
                                                {data.assigned_users.length} of {allAvailableUsers.length} members selected
                                            </span>
                                        </div>
                                    )}
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
                                type="submit" disabled={processing || data.sdg_ids.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                           active:scale-95 hover:brightness-110 hover:shadow-lg
                                           disabled:cursor-not-allowed disabled:opacity-60
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                {processing ? 'Saving…' : 'Create Goal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}