import * as LucidIcons from "lucide-react";
import { useRoute } from "ziggy-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { usePage } from "@inertiajs/react";
import { hasPermission } from "@/utils/authorization";

// ─── Brand tokens (60-30-10) ──────────────────────────────────────────────────
// 60% → Deep Forest Green (primary)    — header, index badges, primary actions
// 30% → Electric Yellow (secondary)    — accents, highlights, important states
// 10% → Orange-Red (accent/destructive) — delete actions, critical states

interface TableColumn {
    label: string;
    key: string;
    isBadge?: boolean;
    render?: (row: any) => React.ReactNode;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
    isDate?: boolean;
}

interface ActionConfig {
    label: string;
    icon: keyof typeof LucidIcons;
    route: string;
    className?: string;
    permission?: string;
}

interface TableRow {
    [key: string]: any;
    id?: string | number;
}

interface CustomTableProps {
    columns: TableColumn[];
    actions: ActionConfig[];
    data: TableRow[];
    from: number;
    to?: number;
    total?: number;
    filteredCount?: number;
    totalCount?: number;
    searchTerm?: string;
    onDelete: (row: TableRow) => void;
    onView: (row: TableRow) => void;
    onEdit: (row: TableRow) => void;
    title?: string;
    toolbar?: React.ReactNode;
    filterEmptyState?: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCellValue(col: TableColumn, row: TableRow): string {
    const val = row[col.key];
    if (val === null || val === undefined) return "—";

    const dateTimeKeys = ["time_in", "time_out"];
    const dateOnlyKeys = ["created_at", "period_start", "period_end", "date"];

    if (dateTimeKeys.includes(col.key)) {
        return new Date(val).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC",
        });
    }
    if (dateOnlyKeys.includes(col.key)) {
        return new Date(val).toLocaleDateString("en-US", {
            day: "2-digit", month: "short", year: "numeric",
        });
    }
    return String(val);
}

// Row-number badge — Deep Forest Green (60%)
function IndexBadge({ value }: { value: number }) {
    return (
        <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-black text-[11px] tabular-nums"
        >
            {value}
        </motion.span>
    );
}

// Cell value — handles all display types
function CellValue({ col, row }: { col: TableColumn; row: TableRow }) {
    // Render row (for relationships)
    if (col.render) {
        const rendered = col.render(row);
        if (col.isBadge) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/15 dark:border-primary/30 whitespace-nowrap">
                    {rendered}
                </span>
            );
        }
        return <>{rendered}</>;
    }

    // Image row
    if (col.isImage) {
        return (
            <div className="flex justify-center">
                <motion.img
                    src={row[col.key] as string}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-border transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:scale-125 hover:shadow-lg hover:z-10 relative"
                    whileHover={{ scale: 1.25 }}
                    transition={{ type: "spring", stiffness: 300 }}
                />
            </div>
        );
    }

    // Badge row
    if (col.isBadge) {
        const rendered = col.render ? col.render(row) : formatCellValue(col, row);
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/15 dark:border-primary/30 whitespace-nowrap">
                {rendered}
            </span>
        );
    }

    // Date row
    if (col.isDate) {
        return (
            <span className="text-[13px] font-medium text-foreground/70 whitespace-nowrap">
                {new Date(row[col.key]).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                })}
            </span>
        );
    }

    // Default row
    return (
        <span className="block truncate max-w-[220px] text-foreground/80">
            {formatCellValue(col, row)}
        </span>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ message = "No records found" }: { message?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            <div className="w-14 h-14 rounded-2xl bg-primary/8 dark:bg-primary/15 border border-primary/12 dark:border-primary/25 flex items-center justify-center mb-4">
                <LucidIcons.Inbox className="w-6 h-6 text-primary/40 dark:text-primary/40" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-bold text-foreground mb-1">
                {message}
            </p>
            <p className="text-[12px] text-muted-foreground">
                There is no data to display right now.
            </p>
        </motion.div>
    );
}

// ─── Action dropdown ──────────────────────────────────────────────────────────
function ActionDropdown({
    row,
    actions,
    onDelete,
    onView,
    onEdit,
    route,
}: {
    row: TableRow;
    actions: ActionConfig[];
    onDelete: (r: TableRow) => void;
    onView: (r: TableRow) => void;
    onEdit: (r: TableRow) => void;
    route: ReturnType<typeof useRoute>;
}) {
    const { auth } = usePage().props as any;
    const permissions = auth.permissions;

    const nonDestructive = actions.filter(a => a.label !== "Delete");
    const destructive = actions.filter(a => a.label === "Delete");

    const handleAction = (action: ActionConfig) => {
        if (action.label === "Delete") {
            if (row.id !== undefined && row.id !== null) {
                onDelete(row);
            } else {
                console.error('Cannot delete: row has no id', row);
            }
        } else if (action.label === "View") {
            onView(row);
        } else if (action.label === "Edit") {
            onEdit(row);
        } else if (action.route) {
            if (row.id !== undefined && row.id !== null) {
                window.location.href = route(action.route, row.id);
            } else {
                console.error('Cannot navigate: row has no id', row);
            }
        }
    };

    return (
        <div className="flex justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/8 dark:hover:bg-primary/20 hover:text-primary transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <span className="sr-only">Open menu</span>
                        <LucidIcons.EllipsisVertical className="w-4 h-4" />
                    </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="min-w-[160px] rounded-xl border border-border bg-card shadow-xl p-1"
                >
                    {nonDestructive.map((action, i) => {
                        // Check permission before rendering
                        if (action.permission && !hasPermission(permissions, action.permission)) {
                            return null;
                        }
                        
                        const Icon = LucidIcons[action.icon] as React.ElementType;
                        return (
                            <DropdownMenuItem
                                key={i}
                                onClick={() => handleAction(action)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-foreground/80 hover:bg-primary/8 hover:text-primary cursor-pointer transition-colors focus:bg-primary/8 focus:text-primary"
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                {action.label}
                            </DropdownMenuItem>
                        );
                    })}

                    {destructive.length > 0 && nonDestructive.length > 0 && (
                        <DropdownMenuSeparator className="my-1 border-border" />
                    )}
                    {destructive.map((action, i) => {
                        // Check permission before rendering
                        if (action.permission && !hasPermission(permissions, action.permission)) {
                            return null;
                        }
                        
                        const Icon = LucidIcons[action.icon] as React.ElementType;
                        return (
                            <DropdownMenuItem
                                key={i}
                                onClick={() => handleAction(action)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-accent hover:bg-accent/8 dark:hover:bg-accent/15 cursor-pointer transition-colors focus:bg-accent/8 focus:text-accent"
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                {action.label}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const CustomTable = ({
    columns,
    actions,
    data,
    from,
    to,
    total,
    filteredCount,
    totalCount,
    searchTerm,
    onDelete,
    onView,
    onEdit,
    title,
    toolbar,
    filterEmptyState,
}: CustomTableProps) => {
    const route = useRoute();

    const dataColumns = columns.filter(col => !col.isAction);
    const hasActions = columns.some(col => col.isAction);
    const actionProps = { actions, onDelete, onView, onEdit, route };

    const getHeaderRecordDisplayText = () => {
        if (searchTerm && filteredCount !== undefined && totalCount !== undefined) {
            return (
                <>
                    Showing <span className="font-black text-primary-foreground">{data.length}</span> of{' '}
                    <span className="font-black text-primary-foreground">{filteredCount.toLocaleString()}</span> filtered records
                    <span className="text-primary-foreground/60 ml-1">
                        (from {totalCount.toLocaleString()} total)
                    </span>
                </>
            );
        }
        
        if (total !== undefined && total > 0) {
            return (
                <>
                    Showing <span className="font-black text-primary-foreground">{to || from + data.length - 1}</span> of{' '}
                    <span className="font-black text-primary-foreground">{total.toLocaleString()}</span> records
                </>
            );
        }
        
        return (
            <>
                Showing <span className="font-black text-primary-foreground">{data.length}</span> records
            </>
        );
    };

    const getFooterRecordDisplayText = () => {
        if (searchTerm && filteredCount !== undefined && totalCount !== undefined) {
            return (
                <>
                    Showing <span className="font-black text-foreground">{data.length}</span> of{' '}
                    <span className="font-black text-foreground">{filteredCount.toLocaleString()}</span> filtered records
                    <span className="text-muted-foreground ml-1">
                        (from {totalCount.toLocaleString()} total)
                    </span>
                </>
            );
        }
        
        if (total !== undefined && total > 0) {
            return (
                <>
                    Showing <span className="font-black text-foreground">{to || from + data.length - 1}</span> of{' '}
                    <span className="font-black text-foreground">{total.toLocaleString()}</span> records
                </>
            );
        }
        
        return (
            <>
                Showing <span className="font-black text-foreground">{data.length}</span> records
            </>
        );
    };

    const isEmpty = !data || data.length === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full font-sans"
        >
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Header bar — Deep Forest Green (60%) */}
                <div className="flex items-center gap-3 px-5 py-4 bg-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                        <LucidIcons.Table2 className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-primary-foreground leading-tight truncate">
                            {title ?? "Data Table"}
                        </p>
                        <p className="text-[11px] text-primary-foreground/60 mt-0.5">
                            {getHeaderRecordDisplayText()}
                        </p>
                    </div>
                </div>

                {/* Toolbar slot */}
                {toolbar && (
                    <div className="px-5 py-4 border-b border-border bg-muted/30">
                        {toolbar}
                    </div>
                )}

                {/* MOBILE (< 768px) — stacked field cards */}
                <div className="block md:hidden">
                    <div className="divide-y divide-border">
                        {isEmpty ? (
                            filterEmptyState ?? <EmptyState />
                        ) : (
                        <AnimatePresence>
                            {data.map((row, index) => (
                                <motion.div
                                    key={row.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="px-4 py-4 bg-card hover:bg-muted/30 transition-colors duration-150"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <IndexBadge value={from + index} />
                                        {hasActions && (
                                            <ActionDropdown
                                                {...actionProps}
                                                row={row}
                                            />
                                        )}
                                    </div>

                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        {dataColumns.map(col => (
                                            <div key={col.key} className="flex flex-col min-w-0">
                                                <dt className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-0.5 truncate">
                                                    {col.label}
                                                </dt>
                                                <dd className="text-[13px] text-foreground/80 overflow-hidden">
                                                    <CellValue col={col} row={row} />
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* TABLET (768px – 1023px) — 2-col card grid */}
                <div className="hidden md:block lg:hidden">
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {isEmpty ? (
                            filterEmptyState ?? <EmptyState />
                        ) : (
                        <AnimatePresence>
                            {data.map((row, index) => (
                                <motion.div
                                    key={row.id || index}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                                        <IndexBadge value={from + index} />
                                        {hasActions && (
                                            <ActionDropdown
                                                {...actionProps}
                                                row={row}
                                            />
                                        )}
                                    </div>

                                    <dl className="space-y-2">
                                        {dataColumns.map(col => (
                                            <div key={col.key} className="flex items-start justify-between gap-3 min-w-0">
                                                <dt className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground shrink-0 pt-0.5">
                                                    {col.label}
                                                </dt>
                                                <dd className="text-[12.5px] font-medium text-foreground/80 text-right overflow-hidden max-w-[55%]">
                                                    <CellValue col={col} row={row} />
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* DESKTOP (≥ 1024px) — full data table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="w-14 px-5 py-3 text-center text-[10px] font-black tracking-widest uppercase text-primary whitespace-nowrap">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-muted-foreground ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {isEmpty ? (
                                <tr>
                                    <td colSpan={columns.length + 1}>
                                        {filterEmptyState ?? <EmptyState />}
                                    </td>
                                </tr>
                            ) : (
                            <AnimatePresence>
                                {data.map((row, index) => (
                                    <motion.tr
                                        key={row.id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                        className="group border-b border-border last:border-0 bg-card hover:bg-primary/5 transition-colors duration-150"
                                    >
                                        <td className="px-5 py-3.5 text-center align-middle">
                                            <IndexBadge value={from + index} />
                                        </td>

                                        {columns.map(col => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3.5 align-middle text-left text-foreground/80 overflow-hidden ${col.className ?? ""}`}
                                            >
                                                {col.isAction ? (
                                                    <ActionDropdown
                                                        {...actionProps}
                                                        row={row}
                                                    />
                                                ) : (
                                                    <CellValue col={col} row={row} />
                                                )}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Enhanced Record Information */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <p className="text-[11px] font-medium text-muted-foreground">
                            {getFooterRecordDisplayText()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>Row {from} – {to || from + data.length - 1}</span>
                        {totalCount !== undefined && totalCount > 0 && (
                            <span className="px-2 py-0.5 bg-muted rounded-full">
                                Total: {totalCount.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};