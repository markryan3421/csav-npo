import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import { LoaderCircle, Clock, ArrowLeft, AlertCircle, FileText, Upload, Trash2 } from 'lucide-react';
import { useState, useRef, DragEvent } from 'react';
import InputError from '@/components/input-error';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';

interface Task {
    id: number; slug: string; title: string; description: string;
    deadline: string | null; status: string;
    goal?: { slug: string; title: string; };
}

const ALLOWED = ['doc','docx','pdf','xls','xlsx','ppt','pptx','txt','zip','rar','jpg','jpeg','png','gif'];
const ACCEPT  = '.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif';
const MAX_MB  = 10;

function validateFile(f: File): boolean {
    const ext = f.name.split('.').pop()?.toLowerCase();
    return !!ext && ALLOWED.includes(ext) && f.size <= MAX_MB * 1024 * 1024;
}

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

function DropZone({ files, onChange, disabled }: {
    files: File[]; onChange: (f: File[]) => void; disabled?: boolean;
}) {
    const [drag, setDrag] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const add = (list: FileList | null) => {
        if (!list) return;
        onChange([...files, ...Array.from(list).filter(validateFile)]);
    };
    const remove = (i: number) => { const n = [...files]; n.splice(i, 1); onChange(n); };
    const onDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(true);  };
    const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(false); };
    const onDrop      = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); };

    return (
        <div className="space-y-3">
            <div className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200
                    ${drag ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary hover:bg-primary/5'}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                onClick={() => ref.current?.click()}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span><span className="mx-1">or drag and drop</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">DOC, DOCX, PDF, XLS, PPT, TXT, ZIP, Images — max {MAX_MB} MB</p>
                <input ref={ref} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => add(e.target.files)} />
            </div>
            {files.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                        {files.map((f, i) => {
                            const ext = f.name.split('.').pop()?.toLowerCase();
                            const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext ?? '');
                            return (
                                <div key={i} className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-all hover:border-primary/40 hover:bg-primary/5">
                                    {isImg ? <img src={URL.createObjectURL(f)} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                                           : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-4 w-4 text-primary" /></div>}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                                        <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button type="button" onClick={() => remove(i)} disabled={disabled}
                                        className="shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-accent">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary">
                        <Upload className="h-3.5 w-3.5" /> Add more
                        <input type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => add(e.target.files)} />
                    </label>
                </div>
            )}
        </div>
    );
}

export default function LateResubmit({ task }: { task: Task }) {
    const { data, setData, put, processing, errors } = useForm({
        subject: '', comments: '', files: [] as File[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(TaskProductivityController.storeLateResubmit(task.slug).url, { forceFormData: true });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        ...(task.goal ? [{ title: task.goal.title, href: `/goals/${task.goal.slug}` }] : []),
        { title: 'Late Submission', href: '#' },
    ];

    const overdueDays = task.deadline
        ? Math.abs(Math.floor((new Date().getTime() - new Date(task.deadline).getTime()) / 86400000))
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Late Submission" />
            <style>{`
                @keyframes formFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-md">
                                <Clock className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{task.title}</p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Late Submission</h1>
                            </div>
                        </div>
                        <button type="button" onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95">
                            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
                        </button>
                    </div>

                    {/* Overdue warning strip */}
                    <div className="form-section mb-5 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                Submitting after deadline
                                {overdueDays !== null && (
                                    <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-black text-accent">
                                        {overdueDays}d overdue
                                    </span>
                                )}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                This submission will be marked as a late resubmission. It will still be reviewed by your project manager.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <FormSection icon={FileText} title="Submission Details" index={0}>
                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Subject
                                </Label>
                                <Input id="subject" value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    required placeholder="What is this late submission about?"
                                    disabled={processing}
                                    className="h-11 rounded-xl border-2 transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent" />
                                <InputError message={errors.subject} />
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
                                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submission Date</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="comments" className="text-sm font-semibold">Comments</Label>
                                <CustomTextarea id="comments" rows={4} value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    disabled={processing}
                                    placeholder="Explain the reason for late submission and any relevant context…"
                                    className="w-full resize-none rounded-xl border-2 px-4 py-3 text-sm transition-all focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent" />
                                <InputError message={errors.comments} />
                            </div>
                        </FormSection>

                        <FormSection icon={Upload} title="Attach Files" index={1}>
                            <DropZone files={data.files} onChange={(f) => setData('files', f)} disabled={processing} />
                            <InputError message={errors.files as string} />
                        </FormSection>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground"><span className="text-accent">*</span> Required</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => window.history.back()} disabled={processing}
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing || data.files.length === 0}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                               active:scale-95 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? 'Submitting…' : 'Submit Task'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}