import SdgController from "@/actions/App/Http/Controllers/SdgController";
import { CustomToast, toast } from "@/components/custom-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { destroy } from "@/routes/sdg";
import { injectStyles } from "@/utils/style";
import { Link, router } from "@inertiajs/react";
import { Pencil, Trash2, Plus, Target } from "lucide-react";
import { useState } from "react";

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

// ─── SDG Grid (Page) ─────────────────────────────────────────────────────────
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

        // Call your delete API (Inertia, fetch, etc.)
        // Example with Inertia:
        router.delete(SdgController.destroy(itemToDelete.slug), {
            onSuccess: (response: { props: FlashProps }) => {
                const successMessage = response.props.flash?.success || 'SDG deleted successfully.'
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (error: Record<string, string>) => {
                const errorMessage = error?.message || 'Failed to delete SDG.';
                toast.error(errorMessage);
            }
        });
    };

    // ─── SDG Card ────────────────────────────────────────────────────────────────
    function SDGCard({ sdg, index, featured = false }: { sdg: any; index: number; featured?: boolean }) {
        injectStyles();

        return (
            <article
                className="sdg-card group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border"
                style={{ animationDelay: `${index * 75}ms` }}
                aria-label={`SDG Goal ${sdg.id}: ${sdg.name}`}
            >
                {/* ── Bottom accent bar (orange-red — 10% accent) ── */}
                <div className="absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-accent" />

                {/* ── Image Block ── */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    {/* Primary green gradient overlay (60%) */}
                    <div
                        className="sdg-overlay absolute inset-0 z-10"
                        style={{
                            background: "linear-gradient(150deg, #004f39e0 0%, #004f3960 45%, transparent 100%)",
                        }}
                    />
                    {/* Bottom scrim for legibility */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Decorative goal number */}
                    <span
                        className="sdg-number absolute bottom-3 right-4 z-20 select-none font-black leading-none"
                        style={{
                            fontSize: "clamp(2.8rem, 7vw, 4.5rem)",
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                            color: "#fdfa00",          /* 30% secondary — electric yellow */
                            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                        }}
                        aria-hidden="true"
                    >
                        {String(sdg.id).padStart(2, "0")}
                    </span>

                    {/* Featured badge (yellow — 30%) */}
                    {featured && (
                        <div className="absolute left-3 top-3 z-20">
                            <span
                                className="sdg-featured-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                                style={{ backgroundColor: "#fdfa00", color: "#004f39" }}
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: "#004f39" }}
                                />
                                Featured
                            </span>
                        </div>
                    )}

                    <img
                        src={sdg.cover_photo}
                        alt={`Cover photo for ${sdg.name}`}
                        className="sdg-image h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* ── Content Block ── */}
                <div className="flex flex-1 flex-col p-5">
                    {/* Goal label (accent orange-red — 10%) */}
                    <p
                        className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "#eb3d00" }}
                    >
                        Goal {sdg.id}
                    </p>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-card-foreground">
                        {sdg.name}
                    </h3>

                    {/* Description */}
                    <p className="flex-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {sdg.description}
                    </p>

                    {/* Divider */}
                    <div className="my-4 h-px bg-border" />

                    {/* Action row */}
                    <div className="flex items-center gap-2">
                        {/* Explore — ghost style with yellow hover (30%) */}
                        <Link
                            as="button"
                            className="flex-1 rounded-xl border-2 border-border p-2 text-sm font-semibold text-muted-foreground transition-all duration-200
                                   hover:border-[#fdfa00] hover:bg-[#fdfa00] hover:text-[#004f39]
                                   active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2
                                   dark:hover:text-[#004f39]"
                            href="#"
                            aria-label={`Explore ${sdg.name}`}
                        >
                            Explore

                            {/* Place on the right */}
                            <span className="ms-2"> &rarr; </span>
                        </Link>

                        {/* Edit — primary green (60%) */}
                        <Link
                            as="button"
                            className="sdg-btn-shimmer inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200
                                   active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2
                                   hover:brightness-110 hover:shadow-md"
                            style={{ backgroundColor: "#004f39" }}
                            href={SdgController.edit(sdg.slug)}
                            aria-label={`Edit ${sdg.name}`}
                        >
                            <Pencil className="h-4 w-4" />
                        </Link>

                        {/* Delete — accent orange-red (10%) */}
                        <Button
                            className="sdg-btn-shimmer inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200
                                   active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2
                                   hover:brightness-110 hover:shadow-md"
                            style={{ backgroundColor: "#004f39" }}
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(sdg)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </article>
        );
    }


    return (
        <section
            className="min-h-screen py-10 md:py-14 lg:py-18"
            aria-label="Sustainable Development Goals"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <CustomToast />
                {/* ── Section Header ── */}
                <div className="sdg-header mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-start gap-4">
                        {/* Icon lockup */}
                        <div
                            className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                            style={{ backgroundColor: "#004f39" }}
                        >
                            <Target className="h-7 w-7" style={{ color: "#fdfa00" }} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                                United Nations
                            </p>
                            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                Sustainable{" "}
                                <span
                                    className="relative inline-block"
                                    style={{ color: "#004f39" }}
                                >
                                    Development
                                    {/* Yellow underline accent */}
                                    <span
                                        className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full"
                                        style={{ backgroundColor: "#fdfa00" }}
                                    />
                                </span>{" "}
                                Goals
                            </h2>
                        </div>
                    </div>

                    {/* Right side: count + add button */}
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-sm text-muted-foreground">
                            <span
                                className="mr-1 inline-block rounded-md px-2 py-0.5 text-xs font-black"
                                style={{ backgroundColor: "#fdfa00", color: "#004f39" }}
                            >
                                {sdgs.length}
                            </span>
                            goals configured
                        </p>
                        <Link
                            as="button"
                            className="add-goal-btn sdg-btn-shimmer inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3d00] focus-visible:ring-offset-2"
                            style={{ backgroundColor: "#004f39" }}
                            href={SdgController.create().url}
                        >
                            <Plus className="h-4 w-4" />
                            Add Goal
                        </Link>
                    </div>
                </div>

                {/* ── Empty state ── */}
                {sdgs.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                        <Target
                            className="mb-4 h-12 w-12"
                            style={{ color: "#004f39", opacity: 0.4 }}
                        />
                        <p className="text-lg font-semibold text-muted-foreground">No goals yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add your first SDG to get started.
                        </p>
                    </div>
                )}

                {/* ── Responsive Grid ── */}
                {/* mobile: 1 col | tablet (sm): 2 col | desktop (lg): 3 col */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {sdgs.map((sdg, index) => (
                        <SDGCard
                            key={sdg.id}
                            sdg={sdg}
                            index={index}
                            featured={index === 0}
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
                    isDeleting={false} // set to true when deletion is in progress
                />
            </div>
        </section>
    );
}