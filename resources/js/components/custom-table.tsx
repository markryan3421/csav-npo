import { Link } from "@inertiajs/react";
import * as LucidIcons from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────
interface TableColumn {
    label: string;
    key: string;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
    type?: string;
}

interface ActionConfig {
    label: string;
    icon: keyof typeof LucidIcons;
    url?: string;
    className?: string;
}

interface TableRow {
    [key: string]: any;
}

interface CustomTableProps {
    columns: TableColumn[];
    actions: ActionConfig[];
    data: TableRow[];
    from: number;
    onDelete: (id: number) => void;
    onView: (row: TableRow) => void;
    onEdit: (row: TableRow) => void;
    isModal?: boolean;
}

// ── Action button renderer ────────────────────────────────────────────────────
function ActionButtons({ row, actions, isModal, onDelete, onView, onEdit }: {
    row: TableRow;
    actions: ActionConfig[];
    isModal?: boolean;
    onDelete: (id: number) => void;
    onView: (row: TableRow) => void;
    onEdit: (row: TableRow) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-1.5">
            {actions.map((action, index) => {
                const IconComponent = LucidIcons[action.icon] as React.ElementType;

                // ── View (modal) ──────────────────────────────────────────
                if (isModal && action.label === 'View') {
                    return (
                        <button
                            key={index}
                            onClick={() => onView(row)}
                            title="View"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground
                                       transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                        >
                            <IconComponent size={14} />
                        </button>
                    );
                }

                // ── Edit (modal) ──────────────────────────────────────────
                if (isModal && action.label === 'Edit') {
                    return (
                        <button
                            key={index}
                            onClick={() => onEdit(row)}
                            title="Edit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground
                                       transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                        >
                            <IconComponent size={14} />
                        </button>
                    );
                }

                // ── Delete ────────────────────────────────────────────────
                if (action.label === 'Delete') {
                    return (
                        <button
                            key={index}
                            onClick={() => onDelete(row.id)}
                            title="Delete"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-accent/10 text-accent
                                       transition-all duration-150 hover:bg-accent hover:text-accent-foreground
                                       active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                        >
                            <IconComponent size={14} />
                        </button>
                    );
                }

                // ── Link action (e.g. Show) ────────────────────────────────
                return (
                    <Link
                        key={index}
                        as="button"
                        href={action.url ?? '#'}
                        title={action.label}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground
                                   transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground
                                   active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                        <IconComponent size={14} />
                    </Link>
                );
            })}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export const CustomTable = ({
    columns, actions, data, from,
    onDelete, onView, onEdit, isModal,
}: CustomTableProps) => {
    return (
        <>
            {/* Inject animations once */}
            <style>{`
                @keyframes tableRowIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .table-row-animate {
                    animation: tableRowIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes tableHeadIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .table-head-animate {
                    animation: tableHeadIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
            `}</style>

            {/*
              Responsive strategy:
              - Mobile  (<640px): horizontal scroll with sticky # column
              - Tablet  (≥640px): full table visible, tighter padding
              - Desktop (≥1024px): generous padding, hover effects
            */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse text-sm">

                        {/* ── Header ── */}
                        <thead>
                            <tr className="table-head-animate border-b border-border bg-primary">
                                {/* Row number */}
                                <th className="w-12 px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
                                    #
                                </th>

                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-primary-foreground/70 ${column.isAction ? 'text-center' : ''} ${column.className ?? ''}`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* ── Body ── */}
                        <tbody className="divide-y divide-border">
                            {data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="table-row-animate group transition-colors duration-150 hover:bg-primary/5"
                                        style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                        {/* Row number — subtle secondary accent on hover */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black text-muted-foreground transition-all duration-150 group-hover:bg-secondary group-hover:text-secondary-foreground">
                                                {from + index}
                                            </span>
                                        </td>

                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3 ${col.isAction ? 'text-center' : 'text-left'} ${col.className ?? ''}`}
                                            >
                                                {/* Image cell */}
                                                {col.isImage ? (
                                                    <div className="flex justify-center">
                                                        <img
                                                            src={row[col.key]}
                                                            alt="Image"
                                                            className="h-12 w-12 rounded-xl object-cover ring-2 ring-border transition-all duration-200 group-hover:ring-primary/30 sm:h-16 sm:w-16"
                                                        />
                                                    </div>
                                                ) : col.isAction ? (
                                                    /* Actions cell */
                                                    <ActionButtons
                                                        row={row}
                                                        actions={actions}
                                                        isModal={isModal}
                                                        onDelete={onDelete}
                                                        onView={onView}
                                                        onEdit={onEdit}
                                                    />
                                                ) : col.key === 'created_at' ? (
                                                    /* Date cell */
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(row[col.key]).toLocaleDateString('en-US', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                ) : col.type === 'multi-values' && Array.isArray(row[col.key]) ? (
                                                    <div className="flex flex-wrap justify-center items-center gap-1">
                                                        {row[col.key].map((permission: any) => (
                                                            <Badge key={permission.id} variant='outline' className="bg-primary text-white p-2">
                                                                {permission.label || permission.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* Default text cell */
                                                    <span className="text-sm text-foreground">
                                                        {row[col.key]}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                /* ── Empty state ── */
                                <tr>
                                    <td
                                        colSpan={columns.length + 1}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            {/* Use the Search icon from lucide as a generic empty state */}
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                                <LucidIcons.SearchX className="h-6 w-6 text-primary/50" />
                                            </div>
                                            <p className="text-sm font-semibold text-muted-foreground">
                                                No data found.
                                            </p>
                                            <p className="text-xs text-muted-foreground/60">
                                                Try adjusting your filters or adding new records.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer row count ── */}
                {data.length > 0 && (
                    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5">
                        <p className="text-xs text-muted-foreground">
                            Showing{' '}
                            <span className="font-semibold text-foreground">{from}</span>
                            {' '}–{' '}
                            <span className="font-semibold text-foreground">{from + data.length - 1}</span>
                        </p>
                        {/* 10% accent dot indicator */}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black text-secondary-foreground">
                            {data.length} records
                        </span>
                    </div>
                )}
            </div>
        </>
    );
};