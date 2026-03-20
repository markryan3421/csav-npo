import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { ArrowLeft, LoaderCircle, ImagePlus, Target, RefreshCw } from 'lucide-react';
import SdgController from '@/actions/App/Http/Controllers/SdgController';
import { CustomTextarea } from '@/components/ui/custom-textarea';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface Sdg {
    id: number;
    name: string;
    slug: string;
    description: string;
    cover_photo: string | null;
}

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

interface SdgFormProps {
    sdg?: Sdg;
}

export default function EditSdg({ sdg }: SdgFormProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'SDGs', href: SdgController.index['/sdg']().url },
        { title: sdg?.name ?? 'Edit SDG', href: `/${sdg?.slug}/edit` },
    ];

    interface FormData {
        name: string;
        description: string;
        cover_photo: File | null;
    }

    const { data, setData, post, put, errors, processing, reset } = useForm<FormData>({
        name: sdg?.name ?? '',
        description: sdg?.description ?? '',
        cover_photo: null,
    });

    const [coverPreview, setCoverPreview] = useState<string | null>(
        sdg?.cover_photo ?? null
    );
    const [isNewFile, setIsNewFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('cover_photo', file);
            setIsNewFile(true);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!sdg) return;
        put(SdgController.update(sdg.slug).url, {
            forceFormData: true,
            onSuccess: (response: { props: FlashProps }) => {
                const successMessage = response.props.flash?.success || 'Category updated successfully.'
                toast.success(successMessage);
            },
            onError: (error: Record<string, string>) => {
                const errorMessage = error?.message || 'Failed to update category.';
                toast.error(errorMessage);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} >
            <Head title={`Edit — ${sdg?.name ?? 'SDG'}`} />

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
                                    Editing Goal {sdg?.id && String(sdg.id).padStart(2, "0")}
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground line-clamp-1">
                                    {sdg?.name ?? 'Edit SDG'}
                                </h1>
                            </div>
                        </div>

                        <Link
                            as="button"
                            className="inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-200
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2
                                       hover:shadow-md"
                            style={{ borderColor: "#004f39", color: "#004f39" }}
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
                                <RefreshCw className="h-4 w-4" style={{ color: "#fdfa00" }} />
                            </div>
                            <h2 className="text-sm font-bold tracking-wide" style={{ color: "#fdfa00" }}>
                                Update Sustainable Development Goal
                            </h2>
                            {/* Goal ID pill */}
                            {sdg?.id && (
                                <span
                                    className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black"
                                    style={{ backgroundColor: "rgba(253,250,0,0.15)", color: "#fdfa00" }}
                                >
                                    #{String(sdg.id).padStart(2, "0")}
                                </span>
                            )}
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
                                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                                        (leave empty to keep current)
                                    </span>
                                </Label>

                                {/* Current image display */}
                                {sdg?.cover_photo && (
                                    <div className="overflow-hidden rounded-xl">
                                        <div className="relative">
                                            <img
                                                src={sdg?.cover_photo}
                                                alt="Cover preview"
                                                className="h-40 w-full object-cover transition-all duration-300 sm:h-48"
                                            />
                                            {/* Green overlay with label */}
                                            <div
                                                className="absolute inset-0 flex items-end p-3"
                                                style={{ background: "linear-gradient(to top, rgba(0,79,57,0.85), transparent)" }}
                                            >
                                                <span
                                                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                                                    style={{
                                                        backgroundColor: isNewFile ? "#fdfa00" : "rgba(253,250,0,0.2)",
                                                        color: isNewFile ? "#004f39" : "#fdfa00",
                                                    }}
                                                >
                                                    {isNewFile ? "New image selected" : "Current image"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Upload trigger */}
                                <div
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all duration-200"
                                    onClick={() => fileInputRef.current?.click()}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "#004f39";
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,79,57,0.04)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "";
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                    }}
                                >
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: "rgba(0,79,57,0.08)" }}
                                    >
                                        <ImagePlus className="h-4 w-4" style={{ color: "#004f39" }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {coverPreview ? 'Replace photo' : 'Upload photo'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                                    </div>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    type="file"
                                    name="cover_photo"
                                    accept="image/*"
                                    tabIndex={3}
                                    className="sr-only"
                                    disabled={processing}
                                    aria-label="Upload cover photo"
                                />
                                {data.cover_photo && (
                                    <p className="text-xs text-muted-foreground">
                                        New file:{" "}
                                        <span className="font-medium text-foreground">{data.cover_photo.name}</span>
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
                                    {processing ? 'Updating...' : 'Update SDG'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </AppLayout >
    );
}