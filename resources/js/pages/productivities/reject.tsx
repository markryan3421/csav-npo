import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import InputError from '@/components/input-error';
import { AlertCircle, ArrowLeft, LoaderCircle, XCircle } from 'lucide-react';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';
import { toast } from 'sonner';

interface TaskProductivity {
    id: number;
    status: string;
    created_at: string;
    task?: {
        id: number; title: string; slug: string;
        goal?: { slug: string; title: string; };
    };
}

interface RejectProps { submission: TaskProductivity; }

export default function Reject({ submission }: RejectProps) {
    const { data, setData, post, processing, errors } = useForm({ remarks: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(TaskProductivityController.reject(submission.id).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Reject task sent successfully.'),
            onError: () => toast.error('Please fix the errors below.'),
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
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-md">
                                <XCircle className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Submission #{submission.id}
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Reject Submission
                                </h1>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                    </div>

                    {/* Submission info strip */}
                    <div className="form-section mb-5 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Submission Details
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                #{submission.id} &middot;{' '}
                                {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-secondary-foreground">
                            Pending Review
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Remarks */}
                        <div className="form-section space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm" style={{ animationDelay: '80ms' }}>
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                                    <XCircle className="h-4 w-4 text-accent" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">Rejection Remarks</h3>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Provide specific, constructive feedback explaining why this submission is being rejected
                                and what improvements are needed for resubmission.
                            </p>

                            <div className="space-y-1.5">
                                <Label htmlFor="remarks" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Remarks
                                </Label>
                                <CustomTextarea
                                    id="remarks"
                                    rows={6}
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    required
                                    disabled={processing}
                                    placeholder="Be constructive and specific about what needs to be improved. This feedback will help the submitter understand how to meet the requirements..."
                                    className="w-full resize-none rounded-xl border-2 px-4 py-3 text-sm transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                                />
                                <InputError message={errors.remarks} />
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="form-section flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5" style={{ animationDelay: '140ms' }}>
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Before you reject</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Rejecting this submission will notify the submitter and require them to address your
                                    feedback and resubmit. Make sure your remarks are clear and actionable.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                <span className="text-accent">*</span> Required
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.remarks.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200
                                               active:scale-95 hover:brightness-110 hover:shadow-lg
                                               disabled:cursor-not-allowed disabled:opacity-60
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? 'Processing…' : 'Reject Submission'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}