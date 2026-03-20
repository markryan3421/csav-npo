import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/input-error';
import { ArrowLeft, LoaderCircle, ImagePlus, Target } from 'lucide-react';
import SdgController from '@/actions/App/Http/Controllers/SdgController';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import { useRef, useState } from 'react';
import { toast } from '@/components/custom-toast';

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

export default function CreateSdg() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'SDGs', href: SdgController.index['/sdg']().url },
        { title: 'Create SDG', href: '/sdg/create' },
    ];

    interface FormData {
        name: string;
        description: string;
        cover_photo: null | File;
    }

    const { data, setData, post, errors, processing, reset } = useForm<FormData>({
        name: '',
        description: '',
        cover_photo: null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('cover_photo', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(SdgController.store().url, {
            forceFormData: true,
            onSuccess: (response: { props: FlashProps }) => {
                const successMessage = response.props.flash?.success || 'SDG created successfully.'
                toast.success(successMessage);
                reset();
                setPreview(null);
            },
            onError: (error: Record<string, string>) => {
                const errorMessage = error?.message || 'Failed to create SDG.';
                toast.error(errorMessage);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create SDG" />

            <div className="min-h-screen py-8 md:py-12">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* ── Page Header ── */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                                style={{ backgroundColor: "#004f39" }}
                            >
                                <Target className="h-5 w-5" style={{ color: "#fdfa00" }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    United Nations
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Create SDG
                                </h1>
                            </div>
                        </div>

                        <Link
                            as="button"
                            className="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-200
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                                       hover:shadow-md"
                            style={{
                                borderColor: "#004f39",
                                color: "#004f39",
                                "--tw-ring-color": "#eb3d00",
                            } as React.CSSProperties}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "#004f39";
                                (e.currentTarget as HTMLElement).style.color = "#fdfa00";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "#004f39";
                            }}
                            href={SdgController.index['/sdg']().url}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to SDGs</span>
                        </Link>
                    </div>

                    {/* ── Form Card ── */}
                    <div
                        className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-border bg-card"
                        style={{ borderTop: "4px solid #004f39" }}
                    >
                        {/* Card header bar */}
                        <div
                            className="flex items-center gap-3 px-6 py-4"
                            style={{ backgroundColor: "#004f39" }}
                        >
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg"
                                style={{ backgroundColor: "rgba(253,250,0,0.15)" }}
                            >
                                <Target className="h-4 w-4" style={{ color: "#fdfa00" }} />
                            </div>
                            <h2 className="text-sm font-bold tracking-wide" style={{ color: "#fdfa00" }}>
                                New Sustainable Development Goal
                            </h2>
                        </div>

                        <form onSubmit={submit} className="space-y-6 p-6">

                            {/* ── SDG Name ── */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="flex items-center gap-1 text-sm font-semibold text-foreground"
                                >
                                    <span style={{ color: "#eb3d00" }}>*</span>
                                    SDG Name
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    type="text"
                                    name="name"
                                    placeholder="e.g. No Poverty"
                                    autoFocus
                                    tabIndex={1}
                                    disabled={processing}
                                    className="h-11 rounded-xl border-2 bg-background px-4 text-sm transition-all duration-150
                                               focus:border-[#004f39] focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#eb3d00]
                                               disabled:opacity-50"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* ── Description ── */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="description"
                                    className="flex items-center gap-1 text-sm font-semibold text-foreground"
                                >
                                    <span style={{ color: "#eb3d00" }}>*</span>
                                    Description
                                </Label>
                                <CustomTextarea
                                    id="description"
                                    onChange={(e) => setData('description', e.target.value)}
                                    value={data.description}
                                    name="description"
                                    placeholder="Describe this SDG's objectives and targets..."
                                    rows={4}
                                    tabIndex={2}
                                    disabled={processing}
                                    className="rounded-xl border-2 bg-background px-4 py-3 text-sm transition-all duration-150
                                               focus:border-[#004f39] focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#eb3d00]
                                               disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* ── Cover Photo ── */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground">
                                    Cover Photo
                                    <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                                </Label>

                                {/* Drop zone */}
                                <div
                                    className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200"
                                    style={{ borderColor: preview ? "#004f39" : undefined }}
                                    onClick={() => fileInputRef.current?.click()}
                                    onMouseEnter={(e) => {
                                        if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "#004f39";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "";
                                    }}
                                >
                                    {preview ? (
                                        <div className="relative">
                                            <img
                                                src={preview}
                                                alt="Cover preview"
                                                className="h-48 w-full object-cover"
                                            />
                                            <div
                                                className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100"
                                                style={{ backgroundColor: "rgba(0,79,57,0.75)" }}
                                            >
                                                <p className="text-sm font-semibold" style={{ color: "#fdfa00" }}>
                                                    Click to change image
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                            <div
                                                className="flex h-12 w-12 items-center justify-center rounded-full"
                                                style={{ backgroundColor: "rgba(0,79,57,0.08)" }}
                                            >
                                                <ImagePlus className="h-6 w-6" style={{ color: "#004f39" }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Click to upload
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG, WebP up to 10MB
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    type="file"
                                    name="cover_photo"
                                    accept="image/*"
                                    tabIndex={3}
                                    className="sr-only"
                                    aria-label="Upload cover photo"
                                />
                                {data.cover_photo && (
                                    <p className="text-xs text-muted-foreground">
                                        Selected: <span className="font-medium text-foreground">{data.cover_photo.name}</span>
                                    </p>
                                )}
                                <InputError message={errors.cover_photo} />
                            </div>

                            {/* ── Divider ── */}
                            <div className="h-px bg-border" />

                            {/* ── Submit ── */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    <span style={{ color: "#eb3d00" }}>*</span> Required fields
                                </p>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    tabIndex={4}
                                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200
                                               active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2
                                               disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg"
                                    style={{ backgroundColor: "#004f39", color: "#fdfa00" }}
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? 'Saving...' : 'Create SDG'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}