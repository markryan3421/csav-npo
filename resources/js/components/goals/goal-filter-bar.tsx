/**
 * goal-filter-bar.tsx
 *
 * Reusable filter bar for goal management pages.
 * Configurable to show/hide specific filters based on the context.
 * All controls are h-9 (36px) to match the table's internal density.
 * 
 * This component is purely presentational — all state management is handled
 * by the parent component.
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SearchInput,
    MultiSelectPopover,
    SingleSelectPopover,
    DateRangePicker,
    StatusFilter,
} from '@/components/filters/filter-primitives';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SdgData {
    id: number;
    sdg_name: string;
    sdg_slug: string;
    sdg_number?: string;
}

export interface FilterConfig {
    /** Show search input */
    search?: boolean;
    /** Show SDG filter */
    sdg?: boolean;
    /** Show status filter (active/inactive) */
    status?: boolean;
    /** Show date range filter */
    date?: boolean;
    /** Show priority filter */
    priority?: boolean;
}

interface GoalFilterBarProps {
    // Data
    allSdgs?: SdgData[];
    priorities?: string[];
    
    // Filter values
    searchTerm?: string;
    selectedSdgs?: string[];
    status?: string;  // '' = all | 'active' | 'inactive' | 'completed' | 'pending'
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    selectedPriority?: string;
    
    // Change handlers
    onSearchChange?: (value: string) => void;
    onSdgsChange?: (sdgs: string[]) => void;
    onStatusChange?: (status: string) => void;
    onDateFromChange?: (date: Date | undefined) => void;
    onDateToChange?: (date: Date | undefined) => void;
    onPriorityChange?: (priority: string) => void;
    
    // Clear all
    onClearAll?: () => void;
    
    // Configuration
    filters?: FilterConfig;
    searchPlaceholder?: string;
    /** Optional label for the date range picker (defaults to "Date") */
    dateLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function GoalFilterBar({
    allSdgs = [],
    priorities = ['High', 'Medium', 'Low'],
    searchTerm = '',
    selectedSdgs = [],
    status = '',
    dateFrom,
    dateTo,
    selectedPriority = '',
    onSearchChange,
    onSdgsChange,
    onStatusChange,
    onDateFromChange,
    onDateToChange,
    onPriorityChange,
    onClearAll,
    filters = {
        search: true,
        sdg: true,
        status: true,
        date: true,
        priority: true,
    },
    searchPlaceholder = "Search goals by name or description...",
    dateLabel = "Due Date",
}: GoalFilterBarProps) {

    const sdgOptions = useMemo(
        () => allSdgs.map(sdg => ({ 
            value: sdg.sdg_name, 
            label: sdg.sdg_number ? `${sdg.sdg_number} - ${sdg.sdg_name}` : sdg.sdg_name 
        })),
        [allSdgs],
    );

    const priorityOptions = useMemo(
        () => priorities.map(p => ({ value: p, label: p })),
        [priorities],
    );

    // Check if any filter is active
    const hasActiveFilters = !!(
        (filters.search && searchTerm?.trim()) ||
        (filters.sdg && selectedSdgs.length) ||
        (filters.status && status !== '') ||
        (filters.date && (dateFrom || dateTo)) ||
        (filters.priority && selectedPriority)
    );

    // Count active filters for display
    const activeFilterCount = [
        (filters.search && searchTerm?.trim()) ? 1 : 0,
        (filters.sdg && selectedSdgs.length) ? 1 : 0,
        (filters.status && status !== '') ? 1 : 0,
        (filters.date && (dateFrom || dateTo)) ? 1 : 0,
        (filters.priority && selectedPriority) ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Check if there are any filters enabled besides search
    const hasOtherFilters = filters.sdg || filters.status || filters.date || filters.priority;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            {filters.search && onSearchChange && (
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                />
            )}

            {/* Divider - only show if search is shown and there are other filters */}
            {filters.search && hasOtherFilters && (
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />
            )}

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {filters.sdg && onSdgsChange && (
                    <MultiSelectPopover
                        label="SDG"
                        options={sdgOptions.map(opt => opt.value)}
                        selected={selectedSdgs}
                        onChange={onSdgsChange}
                    />
                )}

                {filters.priority && onPriorityChange && (
                    <SingleSelectPopover
                        label="Priority"
                        options={priorityOptions}
                        value={selectedPriority}
                        onChange={onPriorityChange}
                        placeholder="Priority"
                    />
                )}

                {filters.status && onStatusChange && (
                    <StatusFilter
                        value={status as '' | 'active' | 'inactive' | 'completed' | 'pending'}
                        onChange={onStatusChange}
                    />
                )}

                {filters.date && onDateFromChange && onDateToChange && (
                    <DateRangePicker
                        label={dateLabel}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onFromChange={onDateFromChange}
                        onToChange={onDateToChange}
                        placeholder={dateLabel}
                    />
                )}
            </div>

            {/* Clear all — only when something is active */}
            {hasActiveFilters && onClearAll && (
                <button
                    onClick={onClearAll}
                    className={cn(
                        'inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-xs font-semibold',
                        'text-slate-400 dark:text-slate-500',
                        'hover:text-[#d85e39] dark:hover:text-orange-400',
                        'hover:bg-[#d85e39]/8 dark:hover:bg-[#d85e39]/15',
                        'border border-transparent hover:border-[#d85e39]/20',
                        'transition-all duration-150',
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                    Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
            )}
        </div>
    );
}