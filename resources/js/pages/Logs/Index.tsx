import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { JSX, useState } from 'react';
import {
    FileText, Search, XCircle, AlertTriangle,
    Info, AlertCircle, ServerCrash, FileSearch,
} from 'lucide-react';

interface Log {
    timestamp: string;
    environment: string;
    level: string;
    message: string;
}

interface LogFile {
    name: string;
    size: string;
    modified: number;
    path: string;
}

interface Props {
    logFiles: LogFile[];
    logs: {
        data: Log[];
        links: any[];
    };
    selectedFile: string;
}

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, {
    badge: string;
    row: string;
    icon: JSX.Element;
    dot: string;
}> = {
    error: {
        badge: 'bg-accent/10 text-accent border border-accent/20',
        row:   'hover:bg-accent/5',
        dot:   'bg-accent',
        icon:  <XCircle className="h-3 w-3" />,
    },
    warning: {
        badge: 'bg-secondary text-secondary-foreground border border-secondary/40',
        row:   'hover:bg-secondary/10',
        dot:   'bg-secondary',
        icon:  <AlertTriangle className="h-3 w-3" />,
    },
    info: {
        badge: 'bg-primary/10 text-primary border border-primary/20',
        row:   'hover:bg-primary/5',
        dot:   'bg-primary',
        icon:  <Info className="h-3 w-3" />,
    },
    debug: {
        badge: 'bg-muted text-muted-foreground border border-border',
        row:   'hover:bg-muted/60',
        dot:   'bg-muted-foreground/40',
        icon:  <AlertCircle className="h-3 w-3" />,
    },
};

function LevelBadge({ level }: { level: string }) {
    const cfg = LEVEL_CONFIG[level.toLowerCase()] ?? LEVEL_CONFIG.debug;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {level}
        </span>
    );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ level, count, total }: { level: string; count: number; total: number }) {
    const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.debug;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${cfg.badge.includes('text-') ? cfg.badge.split(' ').find(c => c.startsWith('text-')) : 'text-muted-foreground'}`}>
                    {cfg.icon}
                    {level}
                </span>
                <span className="text-xs font-bold text-foreground">{count}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{pct}% of entries</p>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LogsIndex({ logFiles, logs, selectedFile }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = logs.data.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Counts per level
    const counts = logs.data.reduce<Record<string, number>>((acc, log) => {
        const l = log.level.toLowerCase();
        acc[l] = (acc[l] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={[{ title: 'Logs', href: '/logs' }]}>
            <Head title="Application Logs" />

            <style>{`
                @keyframes logsReveal {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .logs-reveal { animation: logsReveal 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes rowIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .log-row { animation: rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">

                {/* ── Page header ── */}
                <div className="logs-reveal flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <ServerCrash className="h-4 w-4 text-primary" />
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Application Logs</h1>
                        </div>
                        <p className="text-sm text-muted-foreground pl-10">Monitor and debug your application in real time.</p>
                    </div>

                    {/* File selector */}
                    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <select
                            value={selectedFile}
                            onChange={(e) => window.location.href = `/logs?file=${e.target.value}`}
                            className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
                        >
                            {logFiles.map(file => (
                                <option key={file.name} value={file.name}>
                                    {file.name} ({file.size})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Stat pills ── */}
                <div className="logs-reveal grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: '60ms' }}>
                    {(['error', 'warning', 'info', 'debug'] as const).map(level => (
                        <StatPill
                            key={level}
                            level={level}
                            count={counts[level] ?? 0}
                            total={logs.data.length}
                        />
                    ))}
                </div>

                {/* ── Search ── */}
                <div className="logs-reveal relative" style={{ animationDelay: '100ms' }}>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search logs by message or level…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 w-full rounded-xl border border-border bg-card py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground
                                   focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="logs-reveal overflow-hidden rounded-2xl border border-border bg-card shadow-sm" style={{ animationDelay: '140ms' }}>

                    {/* Table header row */}
                    <div className="border-b border-border bg-muted/40 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Log Entries
                            </p>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                {filteredLogs.length} {filteredLogs.length !== logs.data.length && `of ${logs.data.length}`} entries
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/20">
                                    <th className="w-44 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Timestamp
                                    </th>
                                    <th className="w-32 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Level
                                    </th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Message
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <FileSearch className="h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-sm font-semibold text-muted-foreground">No log entries found</p>
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="rounded-xl border-2 border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, index) => {
                                        const cfg = LEVEL_CONFIG[log.level.toLowerCase()] ?? LEVEL_CONFIG.debug;
                                        return (
                                            <tr
                                                key={index}
                                                className={`log-row transition-colors ${cfg.row}`}
                                                style={{ animationDelay: `${Math.min(index * 20, 400)}ms` }}
                                            >
                                                {/* Timestamp */}
                                                <td className="w-44 whitespace-nowrap px-4 py-3 align-top">
                                                    <p className="text-[11px] font-semibold text-foreground">
                                                        {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>
                                                </td>

                                                {/* Level */}
                                                <td className="w-32 px-4 py-3 align-top">
                                                    <LevelBadge level={log.level} />
                                                </td>

                                                {/* Message */}
                                                <td className="px-4 py-3 align-top">
                                                    <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">
                                                        {log.message}
                                                    </pre>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ── */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-border px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                Showing <span className="font-bold text-foreground">{filteredLogs.length}</span> of{' '}
                                <span className="font-bold text-foreground">{logs.data.length}</span> entries
                            </p>
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={[
                                            'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all',
                                            link.active
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : link.url
                                                    ? 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                                                    : 'cursor-not-allowed opacity-30 border border-border text-muted-foreground',
                                        ].join(' ')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}