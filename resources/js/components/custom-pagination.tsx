import { Link } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface PaginationData {
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface PaginationProps {
    pagination: PaginationData;
    perPage: string;
    onPerPageChange: (value: string) => void;
    totalCount: number;
    filteredCount: number;
    search: string;
    resourceName?: string;
}

export const CustomPagination = ({
    pagination,
    perPage,
    onPerPageChange,
    totalCount,
    filteredCount,
    search,
    resourceName = "item",
}: PaginationProps) => {

    const windowSize = 5;
    const previousLink = pagination.links[0];
    const nextLink = pagination.links[pagination.links.length - 1];
    const pageLinks = pagination.links.slice(1, -1);
    const currentIndex = pageLinks.findIndex(link => link.active);
    const start = Math.floor(currentIndex / windowSize) * windowSize;
    const visiblePages = pageLinks.slice(start, start + windowSize);

    // ── Info text with enhanced styling ─────────────────────────────────────────
    const infoText = search ? (
        <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground text-center sm:text-left"
        >
            Showing{" "}
            <span className="font-semibold text-primary">{filteredCount}</span>
            {" "}{resourceName}{filteredCount !== 1 && "s"} out of{" "}
            <span className="font-semibold text-primary">{totalCount}</span>
            {" "}{resourceName}{totalCount !== 1 && "s"}
        </motion.p>
    ) : (
        <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground text-center sm:text-left"
        >
            Showing{" "}
            <span className="font-semibold text-primary">{pagination.from}</span>
            {" "}–{" "}
            <span className="font-semibold text-primary">{pagination.to}</span>
            {" "}of{" "}
            <span className="font-semibold text-primary">{pagination.total}</span>
            {" "}{resourceName}{totalCount !== 1 && "s"}
        </motion.p>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-4 pt-4 pb-2 font-sans"
        >
            {/* ══════════════════════════════════════════════════════════════════
                MOBILE (below sm — stacked vertically, centered)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center gap-3 sm:hidden">
                {/* Page number buttons */}
                <div className="flex items-center gap-1">
                    <PrevButton link={previousLink} />
                    <AnimatePresence>
                        {visiblePages.map((link, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                            >
                                <PageButton link={link} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <NextButton link={nextLink} />
                </div>

                {/* Info + per-page on the same row */}
                <div className="flex items-center justify-between w-full gap-3">
                    {infoText}
                    <PerPageSelect value={perPage} onChange={onPerPageChange} />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                TABLET / DESKTOP (sm and above — single row, space-between)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="hidden sm:flex items-center justify-between gap-4">
                {/* Left: info text */}
                {infoText}

                {/* Center: page number buttons */}
                <div className="flex items-center gap-1">
                    <PrevButton link={previousLink} />
                    <AnimatePresence>
                        {visiblePages.map((link, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                            >
                                <PageButton link={link} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <NextButton link={nextLink} />
                </div>

                {/* Right: rows per page */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-center gap-2"
                >
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Rows per page
                    </span>
                    <PerPageSelect value={perPage} onChange={onPerPageChange} />
                </motion.div>
            </div>
        </motion.div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Previous (‹) button with enhanced styling */
function PrevButton({ link }: { link: LinkProps }) {
    if (!link?.url) {
        return (
            <motion.span
                whileHover={{ scale: 0.95 }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground/40 cursor-not-allowed"
            >
                <ChevronLeft size={14} />
            </motion.span>
        );
    }
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Link
                href={link.url}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200"
            >
                <ChevronLeft size={14} />
            </Link>
        </motion.div>
    );
}

/** Next (›) button with enhanced styling */
function NextButton({ link }: { link: LinkProps }) {
    if (!link?.url) {
        return (
            <motion.span
                whileHover={{ scale: 0.95 }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground/40 cursor-not-allowed"
            >
                <ChevronRight size={14} />
            </motion.span>
        );
    }
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Link
                href={link.url}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200"
            >
                <ChevronRight size={14} />
            </Link>
        </motion.div>
    );
}

/** Numbered page button with active state highlighting */
function PageButton({ link }: { link: LinkProps }) {
    const base = "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[12px] font-medium transition-all duration-200";

    if (link.active) {
        return (
            <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className={`${base} bg-primary border-primary text-primary-foreground shadow-sm cursor-default`}
            >
                {link.label}
            </motion.span>
        );
    }

    if (!link.url) {
        return (
            <span className={`${base} border-border bg-card text-muted-foreground/40 cursor-not-allowed`}>
                {link.label}
            </span>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Link
                href={link.url}
                className={`${base} border-border bg-card text-foreground/70 hover:bg-primary/10 hover:border-primary/50 hover:text-primary`}
            >
                {link.label}
            </Link>
        </motion.div>
    );
}

/** Rows-per-page select with enhanced styling */
function PerPageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <Select onValueChange={onChange} value={value}>
            <SelectTrigger className="h-8 w-[72px] text-xs border-border bg-card text-foreground focus:ring-primary/50 transition-all duration-200 hover:border-primary/50">
                <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent className="text-xs border-border bg-card">
                <SelectItem value="10" className="focus:bg-primary/10 focus:text-primary">10</SelectItem>
                <SelectItem value="25" className="focus:bg-primary/10 focus:text-primary">25</SelectItem>
                <SelectItem value="50" className="focus:bg-primary/10 focus:text-primary">50</SelectItem>
                <SelectItem value="100" className="focus:bg-primary/10 focus:text-primary">100</SelectItem>
            </SelectContent>
        </Select>
    );
}