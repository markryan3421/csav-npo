import SdgController from "@/actions/App/Http/Controllers/SdgController";
import { CustomToast, toast } from "@/components/custom-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-modal";
import { PermissionGuard } from "@/components/permission-guard";
import { Button } from "@/components/ui/button";
import { injectStyles } from "@/utils/style";
import { Link, router } from "@inertiajs/react";
import { Pencil, Trash2, Plus, Target, ImageOff } from "lucide-react";
import { useState } from "react";

interface FlashProps extends Record<string, any> {
    flash?: { success?: string; error?: string; }
}

// Fallback image SVG (inline as data URI or use a local file)
const FALLBACK_IMAGE = '/images/sdg-placeholder.jpg'; // Or use a data URI
// Alternative: Use a colorful SVG placeholder
const COLORFUL_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%233B82F6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24" font-family="monospace"%3ESDG%3C/text%3E%3C/svg%3E';

function SDGCard({ sdg, index, featured = false, onDelete }: {
    sdg: any; index: number; featured?: boolean;
    onDelete: (sdg: { id: number; slug: string; name: string }) => void;
}) {
    injectStyles();
    
    // Check if image exists and is valid
    const [imgError, setImgError] = useState(false);
    const imageUrl = sdg.cover_photo && !imgError ? sdg.cover_photo : null;

    return (
        <article
            className="sdg-card group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border"
            style={{ animationDelay: `${index * 75}ms` }}
            aria-label={`SDG Goal ${sdg.id}: ${sdg.name}`}
        >
            {/* 10% accent bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-accent" />

            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* 60% primary overlay */}
                <div className="sdg-overlay absolute inset-0 z-10 bg-gradient-to-br from-primary/90 via-primary/40 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                {/* Decorative number — 30% secondary */}
                <span
                    className="sdg-number absolute bottom-3 right-4 z-20 select-none font-black leading-none text-secondary"
                    style={{
                        fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                    }}
                    aria-hidden="true"
                >
                    {String(sdg.id).padStart(2, '0')}
                </span>

                {/* Featured badge — 30% secondary bg, 60% primary text */}
                {featured && (
                    <div className="absolute left-3 top-3 z-20">
                        <span className="sdg-featured-badge inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
                            Featured
                        </span>
                    </div>
                )}

                {/* Image with fallback */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`Cover photo for ${sdg.name}`}
                        className="sdg-image h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img src="sdg-placeholder.png" alt="" />
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                    Goal {sdg.id}
                </p>

                <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-card-foreground">
                    {sdg.name}
                </h3>

                <p className="flex-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {sdg.description}
                </p>

                <div className="my-4 h-px bg-border" />

                <div className="flex items-center gap-2">
                    <Link
                        as="button"
                        className="flex-1 rounded-xl border-2 border-border p-2 text-sm font-semibold text-muted-foreground transition-all duration-200
                                   hover:border-secondary hover:bg-secondary hover:text-secondary-foreground
                                   active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        href={SdgController.changeSdg(sdg.slug).url}
                        aria-label={`Explore ${sdg.name}`}
                    >
                        Explore <span className="ms-2">&rarr;</span>
                    </Link>

                    <PermissionGuard permission="edit sdg">
                        <Link
                            as="button"
                            className="sdg-btn-shimmer inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200
                                    active:scale-95 hover:brightness-110 hover:shadow-md
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            href={SdgController.edit(sdg.slug)}
                            aria-label={`Edit ${sdg.name}`}
                        >
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </PermissionGuard>

                    <PermissionGuard permission="delete sdg">
                        <Button
                            className="sdg-btn-shimmer inline-flex items-center justify-center rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-all duration-200
                                    active:scale-95 hover:brightness-110 hover:shadow-md
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(sdg)}
                            aria-label={`Delete ${sdg.name}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
            </div>
        </article>
    );
}

export default function SDGGrid({ sdgs = [] }: { sdgs: any[] }) {
    injectStyles();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; slug: string; name: string } | null>(null);

    const openDeleteDialog = (sdg: { id: number; slug: string; name: string }) => {
        setItemToDelete(sdg);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        router.delete(SdgController.destroy(itemToDelete.slug), {
            onSuccess: (response: { props: FlashProps }) => {
                toast.success(response.props.flash?.success || 'SDG deleted successfully.');
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (error: Record<string, string>) => {
                toast.error(error?.message || 'Failed to delete SDG.');
            },
        });
    };

    return (
        <section className="min-h-screen py-10 md:py-14 lg:py-18" aria-label="Sustainable Development Goals">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <CustomToast />

                {/* Header */}
                <div className="sdg-header mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg">
                            <Target className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                United Nations
                            </p>
                            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                Sustainable{' '}
                                <span className="relative inline-block text-primary">
                                    Development
                                    <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-secondary" />
                                </span>{' '}
                                Goals
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-sm text-muted-foreground">
                            <span className="mr-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-black text-secondary-foreground">
                                {sdgs.length}
                            </span>
                            goals configured
                        </p>
                        <PermissionGuard permission="create sdg" fallback={null}>
                            <Link
                                as="button"
                                className="add-goal-btn sdg-btn-shimmer inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                        active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                                href={SdgController.create().url}
                            >
                                <Plus className="h-4 w-4" />
                                Add Goal
                            </Link>
                        </PermissionGuard>
                    </div>
                </div>

                {/* Empty state */}
                {sdgs.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                        <Target className="mb-4 h-12 w-12 text-primary opacity-40" />
                        <p className="text-lg font-semibold text-muted-foreground">No goals yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Add your first SDG to get started.</p>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sdgs.map((sdg, index) => (
                        <SDGCard
                            key={sdg.id}
                            sdg={sdg}
                            index={index}
                            featured={index === 0}
                            onDelete={openDeleteDialog}
                        />
                    ))}
                </div>

                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    itemName={itemToDelete?.name ?? ''}
                    onConfirm={handleDelete}
                    confirmText="Yes, delete"
                    cancelText="No, keep"
                    isDeleting={false}
                />
            </div>
        </section>
    );
}