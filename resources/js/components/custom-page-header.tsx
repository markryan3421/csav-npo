import { ReactNode } from 'react';
import { Brain, Calendar, AlertTriangle, Sparkles, LoaderCircle } from 'lucide-react';

interface CustomPageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    badge?: string;
    lastAnalyzed?: string;
    stats?: {
        highPriority?: number;
        actionable?: number;
        totalInsights?: number;
    };
    actions?: ReactNode;
    children?: ReactNode;
}

export function CustomPageHeader({
    title,
    subtitle,
    icon,
    badge,
    lastAnalyzed,
    stats,
    actions,
    children,
}: CustomPageHeaderProps) {
    // Animation styles (same as in dashboard)
    const fadeUp = (delay = 0): React.CSSProperties => ({
        animation: `dashFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${delay}ms`,
    });

    const scaleIn = (delay = 0): React.CSSProperties => ({
        animation: `dashScaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${delay}ms`,
    });

    // Inject keyframes if not already present
    if (typeof document !== 'undefined' && !document.getElementById('custom-header-kf')) {
        const style = document.createElement('style');
        style.id = 'custom-header-kf';
        style.textContent = `
            @keyframes dashFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            @keyframes dashScaleIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        `;
        document.head.appendChild(style);
    }

    return (
        <div style={scaleIn(0)} className="bg-primary relative overflow-hidden mb-3">
            {/* Subtle diagonal grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 1px,transparent 14px)' }}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Left: title + meta */}
                    <div style={fadeUp(60)} className="flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            {icon && (
                                <div className="h-9 w-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
                                    {icon}
                                </div>
                            )}
                            <h1 className="text-lg font-extrabold text-primary-foreground tracking-tight">
                                {title}
                            </h1>
                            {badge && (
                                <span className="hidden sm:inline-flex items-center text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-primary-foreground/55 text-xs max-w-lg">
                                {subtitle}
                            </p>
                        )}
                        {(lastAnalyzed || stats) && (
                            <div className="flex items-center flex-wrap gap-4 mt-2.5">
                                {lastAnalyzed && (
                                    <span className="flex items-center gap-1 text-primary-foreground/45 text-[11px]">
                                        <Calendar className="h-3 w-3" />
                                        Last analysed: {new Date(lastAnalyzed).toLocaleDateString()}
                                    </span>
                                )}
                                {stats && (stats.highPriority ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 font-black text-secondary text-[11px]">
                                        <AlertTriangle className="h-3 w-3" />
                                        {stats.highPriority} high priority
                                    </span>
                                )}
                                {stats && (stats.actionable ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 font-semibold text-primary-foreground/60 text-[11px]">
                                        <Sparkles className="h-3 w-3" />
                                        {stats.actionable} actionable
                                    </span>
                                )}
                            </div>
                        )}
                        {children}
                    </div>

                    {/* Right: actions */}
                    {actions && (
                        <div style={fadeUp(140)}>
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}