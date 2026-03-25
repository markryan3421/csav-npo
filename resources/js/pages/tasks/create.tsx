import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CalendarIcon, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Goal {
    id: number;
    slug: string;
    title: string;
    end_date: string;
}

interface CreateTaskProps {
    goal: Goal;
}

export default function Create({ goal }: CreateTaskProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        deadline: '',
    });

    const [date, setDate] = useState<Date | undefined>();

    // Disable dates before today and after goal end date
    const today = startOfDay(new Date());
    const goalEnd = new Date(goal.end_date);
    const isDateDisabled = (date: Date) => {
        return isBefore(date, today) || isAfter(date, goalEnd);
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setData('deadline', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/goals/${goal.slug}/tasks`); // adjust route as needed
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        { title: goal.title, href: `/goals/${goal.slug}` },
        { title: 'Add Task', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Task" />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div className="mb-4 lg:mb-0">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            Create New Task
                        </h1>
                        <p className="text-muted-foreground mt-2">Add a new task to your goal</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Goal</div>
                            <div className="text-lg font-semibold text-blue-400 truncate max-w-xs">
                                {goal.title}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Plus className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Goal Info Card */}
                <div className="bg-gradient-to-br from-card to-card/90 p-6 rounded-2xl border border-border shadow-lg mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-4 border border-primary/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Goal Timeline</h3>
                                <p className="text-sm text-muted-foreground">
                                    Deadline: {format(new Date(goal.end_date), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Days Remaining</div>
                            <div className="text-lg font-bold text-blue-400">
                                {Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Creation Form */}
                <div className="bg-gradient-to-br from-card to-card/90 backdrop-blur-sm rounded-2xl border border-border shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title Field */}
                        <div>
                            <Label htmlFor="task-title" className="block text-sm font-semibold mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Task Title
                            </Label>
                            <Input
                                id="task-title"
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                required
                                placeholder="Enter a clear and specific task title..."
                                className="w-full"
                            />
                            <InputError message={errors.title} />
                        </div>

                        {/* Description Field */}
                        <div>
                            <Label htmlFor="task-description" className="block text-sm font-semibold mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                Description
                            </Label>
                            <CustomTextarea
                                id="task-description"
                                rows={5}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Provide detailed description about what needs to be done, including any specific requirements or objectives..."
                                className="w-full resize-none"
                            />
                            <InputError message={errors.description} />
                        </div>

                        {/* Due Date Field */}
                        <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Timeline & Deadline
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="task-due-date" className="block text-sm font-medium mb-2">
                                        Due Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                id="task-due-date"
                                                className="w-full justify-start px-4 py-3.5 text-left font-normal h-auto"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, 'PPP') : <span>Select task due date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={handleDateSelect}
                                                disabled={isDateDisabled}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.deadline} />
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Must be completed before goal deadline:{' '}
                                        <strong className="text-blue-300">{format(new Date(goal.end_date), 'MMMM d, yyyy')}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-border">
                            <Link
                                href={`/goals/${goal.slug}`}
                                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-muted/50 transition-all duration-200 order-2 sm:order-1"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Cancel
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="group inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transform hover:-translate-y-0.5 order-1 sm:order-2"
                            >
                                <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                                {processing ? 'Creating...' : 'Create Task'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-gradient-to-br from-card to-card/90 backdrop-blur-sm rounded-2xl border border-border p-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-foreground">Creating Effective Tasks</h3>
                            <div className="mt-2 text-sm text-muted-foreground space-y-2">
                                <p className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    Make tasks specific and actionable with clear objectives
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    Set realistic deadlines that align with your goal timeline
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    Include measurable outcomes to track progress effectively
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    Prioritize tasks based on importance and dependencies
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}