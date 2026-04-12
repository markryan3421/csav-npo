import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalMorphProps {
    /** Seconds the eyebrow + title stay visible before animating out */
    textDisplayDuration?: number;
    /** Seconds for the circle pop-in (back-ease) */
    popInDuration?: number;
    /** Seconds for the iris-expand + BG fade */
    morphDuration?: number;
    /** Full-screen overlay BG color */
    initialBgColor?: string;
    /** Starting radius of the iris circle in SVG units */
    radius?: number;
    /** Main heading text */
    text?: string;
    /** Small eyebrow label shown above the heading */
    eyebrow?: string;
    /** Called when the overlay fully unmounts */
    onComplete?: () => void;
}

// ─── easing helpers ───────────────────────────────────────────────────────────
function easeBackOut(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeCubicInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function animateValue(
    from: number,
    to: number,
    durationMs: number,
    easeFn: (t: number) => number,
    onUpdate: (v: number) => void,
    onDone?: () => void,
): () => void {
    const start = performance.now();
    let raf: number;
    function step(now: number) {
        const raw = Math.min((now - start) / durationMs, 1);
        onUpdate(lerp(from, to, easeFn(raw)));
        if (raw < 1) raf = requestAnimationFrame(step);
        else onDone?.();
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
}

// ─── component ────────────────────────────────────────────────────────────────
const PortalMorph: React.FC<PortalMorphProps> = ({
    textDisplayDuration = 0.75,
    popInDuration = 0.55,
    morphDuration = 0.5,
    initialBgColor = '#004025',
    radius = 42,
    text = 'Dashboard',
    eyebrow,
    onComplete,
}) => {
    const [mounted, setMounted] = useState(true);

    const overlayRef = useRef<SVGSVGElement>(null);
    const bgRectRef  = useRef<SVGRectElement>(null);
    const holeRef    = useRef<SVGCircleElement>(null);  // mask cutout circle
    const glowRef    = useRef<SVGCircleElement>(null);  // decorative glow halo
    const eyebrowRef = useRef<HTMLParagraphElement>(null);
    const titleRef   = useRef<HTMLHeadingElement>(null);
    const barRef     = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!mounted) return;

        // Internal SVG coord space 1000 × 562 (≈16:9).
        // MAX_R reaches every corner of the viewport.
        const CX = 500;
        const CY = 281;
        const MAX_R = Math.hypot(CX, CY) + 20;

        const timers: ReturnType<typeof setTimeout>[] = [];
        const cancels: (() => void)[] = [];
        const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

        // ── Phase 1 · reveal text ──────────────────────────────────────────
        after(80, () => {
            if (eyebrow && eyebrowRef.current) {
                eyebrowRef.current.style.transition =
                    'opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)';
                eyebrowRef.current.style.opacity = '1';
                eyebrowRef.current.style.transform = 'translateY(0)';
            }
            after(180, () => {
                if (!titleRef.current) return;
                titleRef.current.style.transition =
                    'opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)';
                titleRef.current.style.opacity = '1';
                titleRef.current.style.transform = 'translateY(0)';

                after(280, () => {
                    if (!barRef.current) return;
                    barRef.current.style.transition = 'width 0.65s cubic-bezier(0.22,1,0.36,1)';
                    barRef.current.style.width = '100%';
                });
            });
        });

        // ── Phase 2 · dismiss text ─────────────────────────────────────────
        const dismissAt = (textDisplayDuration + 0.6) * 1000;
        after(dismissAt, () => {
            if (eyebrow && eyebrowRef.current) {
                eyebrowRef.current.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
                eyebrowRef.current.style.opacity = '0';
                eyebrowRef.current.style.transform = 'translateY(-7px)';
            }
            if (titleRef.current) {
                titleRef.current.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                titleRef.current.style.opacity = '0';
                titleRef.current.style.transform = 'translateY(-10px)';
            }
            if (barRef.current) {
                barRef.current.style.transition = 'width 0.22s ease';
                barRef.current.style.width = '0%';
            }
        });

        // ── Phase 3 · pop in iris ──────────────────────────────────────────
        after(dismissAt + 420, () => {
            if (!holeRef.current || !glowRef.current) return;

            const cancel1 = animateValue(
                0, radius, popInDuration * 1000, easeBackOut,
                (r) => {
                    holeRef.current!.setAttribute('r', String(r));
                    glowRef.current!.setAttribute('r', String(r * 1.7));
                    glowRef.current!.style.opacity = String((r / radius) * 0.55);
                },
                () => {
                    // ── Phase 4 · expand iris + fade BG ───────────────────
                    after(40, () => {
                        const cancel2 = animateValue(
                            radius, MAX_R, morphDuration * 1000, easeCubicInOut,
                            (r) => {
                                holeRef.current!.setAttribute('r', String(r));

                                const p = (r - radius) / (MAX_R - radius);

                                glowRef.current!.setAttribute('r', String(r * 1.18));
                                glowRef.current!.style.opacity = String(
                                    Math.max(0, 0.45 - p * 0.55)
                                );

                                // Fade the green overlay rect as the iris widens
                                if (p > 0.1 && bgRectRef.current) {
                                    bgRectRef.current.style.opacity = String(
                                        Math.max(0, 1 - (p - 0.1) / 0.9)
                                    );
                                }
                            },
                            () => {
                                if (overlayRef.current) overlayRef.current.style.opacity = '0';
                                setMounted(false);
                                onComplete?.();
                            },
                        );
                        cancels.push(cancel2);
                    });
                },
            );
            cancels.push(cancel1);
        });

        return () => {
            timers.forEach(clearTimeout);
            cancels.forEach((c) => c());
        };
    }, [mounted, eyebrow, textDisplayDuration, popInDuration, morphDuration, radius, onComplete]);

    if (!mounted) return null;

    const CX = 500;
    const CY = 281;
    // Unique IDs prevent collisions if multiple instances mount simultaneously
    const maskId = 'pm-cutout-mask';
    const glowId = 'pm-glow-grad';

    const overlay = (
        <div
            className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none"
            aria-hidden="true"
        >
            {/* ── Text block — sits above the SVG so it's visible over green BG ── */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ paddingBottom: '8vh', zIndex: 1 }}
            >
                {eyebrow && (
                    <p
                        ref={eyebrowRef}
                        style={{
                            fontFamily:    "'Boldonse', system-ui, sans-serif",
                            fontSize:      'clamp(9px, 1.6vw, 13px)',
                            letterSpacing: '0.32em',
                            textTransform: 'uppercase',
                            color:         '#fdfa00',
                            opacity:       0,
                            transform:     'translateY(8px)',
                            marginBottom:  '0.5rem',
                            lineHeight:    1,
                        }}
                    >
                        {eyebrow}
                    </p>
                )}

                <h1
                    ref={titleRef}
                    style={{
                        fontFamily: "'Boldonse', system-ui, sans-serif",
                        fontSize:   'clamp(28px, 7vw, 80px)',
                        color:      '#ffffff',
                        lineHeight: 1,
                        opacity:    0,
                        transform:  'translateY(16px)',
                        margin:     0,
                        whiteSpace: 'nowrap',
                        textAlign:  'center',
                    }}
                >
                    {text}
                </h1>

                <span
                    ref={barRef}
                    style={{
                        display:      'block',
                        height:       '3px',
                        width:        '0%',
                        background:   '#fdfa00',
                        borderRadius: '2px',
                        marginTop:    '0.6rem',
                    }}
                />
            </div>

            {/*
             * ── SVG overlay ───────────────────────────────────────────────
             *
             * Cutout technique:
             *   The <mask> is white everywhere (keep green overlay) except over
             *   the iris circle which is black (punch a transparent hole).
             *   The green <rect> applies that mask, so the circle area becomes
             *   fully see-through, revealing whatever page content is behind.
             *
             *   We also animate the <rect> opacity → 0 as the iris expands so
             *   the remaining green ring fades away smoothly at the edges.
             */}
            <svg
                ref={overlayRef}
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${CX * 2} ${CY * 2}`}
                preserveAspectRatio="xMidYMid slice"
                style={{ pointerEvents: 'none' }}
            >
                <defs>
                    <mask id={maskId}>
                        {/* White = show the green overlay rect */}
                        <rect width={CX * 2} height={CY * 2} fill="white" />
                        {/* Black = cut a transparent hole through it */}
                        <circle ref={holeRef} cx={CX} cy={CY} r={0} fill="black" />
                    </mask>

                    <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                        <stop offset="65%" stopColor="#fdfa00" stopOpacity="0" />
                        <stop offset="100%" stopColor="#fdfa00" stopOpacity="0.25" />
                    </radialGradient>
                </defs>

                {/* Green overlay with the iris cutout applied */}
                <rect
                    ref={bgRectRef}
                    width={CX * 2}
                    height={CY * 2}
                    fill={initialBgColor}
                    mask={`url(#${maskId})`}
                />

                {/* Yellow glow halo at the iris edge */}
                <circle
                    ref={glowRef}
                    cx={CX}
                    cy={CY}
                    r={0}
                    fill={`url(#${glowId})`}
                    style={{ opacity: 0 }}
                />
            </svg>
        </div>
    );

    return createPortal(overlay, document.body);
};

export default PortalMorph;