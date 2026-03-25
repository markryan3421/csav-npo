import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import InputError from '@/components/input-error';
import { AlertCircle, Loader2, XCircle } from 'lucide-react';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TaskProductivityFile {
    id: number;
    file_name: string;
    file_path: string;
}

interface TaskProductivity {
    id: number;
    subject: string;
    comments: string | null;
    status: string;
    remarks: string | null;
    created_at: string;
    user: { id: number; name: string; avatar?: string | null };
    task_productivity_files?: TaskProductivityFile[];
    task?: {
        id: number;
        title: string;
        slug: string;
        goal?: {
            slug: string;
            title: string;
        };
    };
}

interface RejectProps {
    submission: TaskProductivity;
}

export default function Reject({ submission }: RejectProps) {
    const { data, setData, post, processing, errors } = useForm({
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(TaskProductivityController.reject(submission.id).url, {
            preserveScroll: true,
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        ...(submission.task?.goal
            ? [{ title: submission.task.goal.title, href: `/goals/${submission.task.goal.slug}` }]
            : []),
        { title: `Reject Submission #${submission.id}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reject Submission" />

            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl mr-4">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Reject Submission</h1>
                            <p className="text-muted-foreground mt-1">
                                Provide feedback for improvement
                            </p>
                        </div>
                    </div>

                    {/* Submission Info */}
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-foreground">Submission Details</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Submission #{submission.id} •{' '}
                                    {new Date(submission.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm font-medium rounded-full">
                                Pending Review
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rejection Form */}
                <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Remarks Field */}
                        <div>
                            <Label htmlFor="remarks" className="block text-lg font-semibold mb-3 flex items-center">
                                <XCircle className="h-6 w-6 text-red-500 mr-2" />
                                Rejection Remarks
                            </Label>
                            <p className="text-muted-foreground text-sm mb-4">
                                Please provide specific feedback on why this submission is being rejected
                                and what improvements are needed.
                            </p>
                            <CustomTextarea
                                id="remarks"
                                rows={6}
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                required
                                placeholder="Be constructive and specific about what needs to be improved. This feedback will help the submitter understand how to meet the requirements..."
                                className="w-full resize-none"
                            />
                            <InputError message={errors.remarks} />
                            <p className="text-xs text-muted-foreground mt-2">* Required field</p>
                        </div>

                        {/* Warning Alert */}
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Important</h4>
                                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                        Rejecting this submission will notify the submitter and require them to
                                        make changes and resubmit.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
                            <Link
                                href={window.history.length > 1 ? undefined : '/goals'}
                                onClick={(e) => {
                                    if (window.history.length > 1) {
                                        e.preventDefault();
                                        window.history.back();
                                    }
                                }}
                                className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl text-foreground transition-all duration-200 font-medium flex items-center justify-center order-2 sm:order-1"
                            >
                                <XCircle className="h-5 w-5 mr-2" />
                                Cancel
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white transition-all duration-200 font-medium flex items-center justify-center shadow-lg hover:shadow-red-500/25 order-1 sm:order-2"
                            >
                                {processing
                                    ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                                    : 'Reject Submission'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}