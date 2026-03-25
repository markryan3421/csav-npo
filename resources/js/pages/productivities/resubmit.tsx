import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import InputError from '@/components/input-error';
import {
    AlertCircle, FileText, Trash2, Upload, X, RotateCcw,
} from 'lucide-react';
import TaskProductivityController from '@/actions/App/Http/Controllers/TaskProductivityController';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task {
    id: number;
    slug: string;
    title: string;
    description: string;
    deadline: string | null;
    status: string;
    goal?: {
        slug: string;
        title: string;
    };
}

interface TaskProductivityFile {
    id: number;
    file_name: string;
    file_path: string;
}

interface TaskProductivity {
    id: number;
    subject: string;
    comments: string | null;
    status: 'pending' | 'approved' | 'rejected' | string;
    remarks: string | null;
    created_at: string;
    user: { id: number; name: string; avatar?: string | null };
    task_productivity_files?: TaskProductivityFile[];
}

interface ResubmitProps {
    task: Task;
    submission: TaskProductivity;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Resubmit({ task, submission }: ResubmitProps) {
    const { data, setData, put, processing, errors } = useForm({
        subject: `Resubmission: ${task.title}`,
        comments: '',
        files: [] as File[],
    });

    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Allowed file extensions (same as in submit form)
    const allowedExtensions = [
        'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'txt',
        'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif',
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const validateFile = (file: File): boolean => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExtensions.includes(ext)) return false;
        if (file.size > maxFileSize) return false;
        return true;
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const validFiles: File[] = [];
        const newFiles = Array.from(files);
        for (const file of newFiles) {
            if (validateFile(file)) {
                validFiles.push(file);
            } else {
                console.warn('Invalid file:', file.name);
                // Optionally show a toast/error here
            }
        }
        setData('files', [...data.files, ...validFiles]);
    };

    const removeFile = (index: number) => {
        const newFiles = [...data.files];
        newFiles.splice(index, 1);
        setData('files', newFiles);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use PUT with file support – Inertia will automatically set _method=PUT
        put(TaskProductivityController.resubmit({ task: task.slug, task_productivity: submission.id }).url, {
            forceFormData: true,
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Goals', href: '/goals' },
        ...(task.goal ? [{ title: task.goal.title, href: `/goals/${task.goal.slug}` }] : []),
        { title: `Resubmit: ${task.title}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Resubmit: ${task.title}`} />

            <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5" />
                    <div className="relative p-8">
                        {/* Header with Warning */}
                        <div className="mb-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        <RotateCcw className="h-6 w-6 text-yellow-500" />
                                        Resubmit Task
                                    </h2>
                                    <p className="text-muted-foreground mt-1">
                                        Your previous submission was rejected. Please address the feedback and resubmit.
                                    </p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium inline-flex items-center gap-2 text-primary border border-primary/30">
                                {task.title}
                            </div>
                        </div>

                        {/* Previous Submission Feedback */}
                        {submission.remarks && (
                            <div className="mb-6 bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-red-300 mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Feedback from Previous Submission
                                </h3>
                                <p className="text-red-200 text-sm">{submission.remarks}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-sm font-semibold">
                                    Subject *
                                </Label>
                                <Input
                                    id="subject"
                                    type="text"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    required
                                    placeholder="What is this resubmission about?"
                                    className="w-full"
                                />
                                <InputError message={errors.subject} />
                            </div>

                            {/* Submission Date (read‑only) */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Resubmission Date</Label>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <svg
                                        className="w-5 h-5 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>
                                        {new Date().toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Response to Feedback */}
                            <div className="space-y-2">
                                <Label htmlFor="comments" className="text-sm font-semibold">
                                    Response to Feedback *
                                    <span className="text-xs text-muted-foreground ml-1">
                                        (Explain how you addressed the feedback)
                                    </span>
                                </Label>
                                <CustomTextarea
                                    id="comments"
                                    rows={4}
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    placeholder="Please describe the changes you made to address the feedback from your previous submission..."
                                    className="w-full resize-none"
                                />
                                <InputError message={errors.comments} />
                            </div>

                            {/* File Upload Section */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">
                                    Attach Updated Files *
                                    <span className="text-xs text-muted-foreground ml-1">
                                        (Include all required files including previous ones if unchanged)
                                    </span>
                                </Label>

                                {/* Drop Zone */}
                                <div
                                    className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
                                        ${dragActive ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'}
                                        hover:border-primary hover:bg-primary/5`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <span className="text-primary font-medium cursor-pointer hover:underline">
                                            Click to upload
                                        </span>
                                        <span className="mx-2">or drag and drop</span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        DOC, DOCX, PDF, XLS, PPT, TXT, ZIP, Images up to 10MB each
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                </div>

                                {/* File Preview List */}
                                {data.files.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            Selected Files ({data.files.length})
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                            {data.files.map((file, idx) => {
                                                const ext = file.name.split('.').pop()?.toLowerCase();
                                                const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                                                    ext || '',
                                                );
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between bg-muted rounded-lg p-3 border border-border hover:border-primary/50 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            {isImage ? (
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt="preview"
                                                                    className="w-10 h-10 rounded object-cover"
                                                                />
                                                            ) : (
                                                                <div className="bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Add More Files Button */}
                                        <div className="pt-3 border-t border-border">
                                            <label className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-muted hover:bg-muted/80 transition-all cursor-pointer">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Add More Files
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                                                    className="hidden"
                                                    onChange={(e) => handleFiles(e.target.files)}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <InputError message={errors.files} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                                <Button
                                    onClick={() => window.history.back()}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition-all duration-200 font-medium text-center"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || data.files.length === 0}
                                    className="flex-1 group relative py-3 px-6 rounded-lg text-sm font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        {processing ? 'Resubmitting...' : 'Resubmit Task'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Help Section */}
                <div className="mt-6 bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-300">Resubmission Tips</h4>
                            <ul className="mt-2 text-sm text-blue-200 space-y-1">
                                <li>• Carefully review the feedback from your previous submission</li>
                                <li>• Clearly explain how you addressed each point in your response</li>
                                <li>• Include all required files, even if some haven't changed</li>
                                <li>• Double-check that all requirements are now met</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}