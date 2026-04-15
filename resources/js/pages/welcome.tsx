import { Head, Link, usePage } from '@inertiajs/react';
import { login } from '@/routes';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Welcome() {
    const { auth } = usePage().props;
    const user = auth.user;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showIntro, setShowIntro] = useState(true);

    const introContainerRef = useRef<HTMLDivElement>(null);
    const introLogoRef = useRef<HTMLImageElement>(null);
    const introTextRef = useRef<HTMLParagraphElement>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const logoLinkRef = useRef<HTMLAnchorElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const ctaContainerRef = useRef<HTMLDivElement>(null);
    const copyrightRef = useRef<HTMLDivElement>(null);

    const fullText = "CSAV Compliance Monitoring Tool";
    const [typedText, setTypedText] = useState("");
    const [typingComplete, setTypingComplete] = useState(false);
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Particle[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            opacity: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 3 + 1;
                this.speedX = (Math.random() - 0.5) * 0.8;
                this.speedY = (Math.random() - 0.5) * 0.8;
                const colors = ['#22c55e', '#f97316', '#eab308', '#ffffff', '#94a3b8'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const particleCount = Math.min(250, Math.floor((width * height) / 8000));
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) {
                p.update();
                p.draw();
            }
            animationId = requestAnimationFrame(animate);
        }

        function resizeHandler() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        }

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        animate();

        return () => {
            window.removeEventListener('resize', resizeHandler);
            cancelAnimationFrame(animationId);
        };
    }, []);

    useEffect(() => {
        if (!introContainerRef.current || !introLogoRef.current || !introTextRef.current) return;

        gsap.set(introContainerRef.current, { clipPath: "circle(100% at center)" });
        gsap.set(introLogoRef.current, { scale: 0.6, opacity: 0 });
        gsap.set(introTextRef.current, { opacity: 0, y: 20 });

        const tl = gsap.timeline({
            onComplete: () => {
                setShowIntro(false);
            }
        });

        tl.to(introLogoRef.current, {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "elastic.out(1, 0.4)",
        })
        .to(introTextRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
        }, "+=0.6")
        .to({}, { duration: 1.5 })
        .to(introContainerRef.current, {
            scale: 0.98,
            duration: 0.6,
            ease: "power2.inOut",
        })
        .to(introContainerRef.current, {
            clipPath: "circle(0% at center)",
            duration: 1.4,
            ease: "expo.in",
        }, "-=0.2")
        .to([introLogoRef.current, introTextRef.current], {
            opacity: 0,
            duration: 0.8,
            ease: "power2.in",
        }, "-=1.0");

        return () => {
            tl.kill();
        };
    }, []);

    useEffect(() => {
        if (!showIntro && mainContainerRef.current) {
            const ctx = gsap.context(() => {
                const tl = gsap.timeline();
                gsap.set(mainContainerRef.current, { autoAlpha: 1 });
                gsap.set([logoLinkRef.current, titleRef.current, descriptionRef.current, ctaContainerRef.current, copyrightRef.current], {
                    opacity: 0,
                    y: 30,
                });

                tl.fromTo(logoLinkRef.current,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "back.out(0.7)" }
                )
                .fromTo(titleRef.current,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
                    "-=0.4"
                )
                .fromTo(descriptionRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                    "-=0.3"
                )
                .fromTo(copyrightRef.current,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.5, ease: "power1.out" },
                    "-=0.1"
                );
                gsap.set(ctaContainerRef.current, { opacity: 0 });
            }, mainContainerRef);
            return () => ctx.revert();
        }
    }, [showIntro]);

    useEffect(() => {
        if (!showIntro) {
            let i = 0;
            const interval = setInterval(() => {
                if (i < fullText.length) {
                    setTypedText(fullText.slice(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                    setTypingComplete(true);
                }
            }, 80);
            return () => clearInterval(interval);
        }
    }, [showIntro, fullText]);

    useEffect(() => {
        if (typingComplete) {
            const cursorInterval = setInterval(() => {
                setShowCursor(prev => !prev);
            }, 500);
            return () => clearInterval(cursorInterval);
        }
    }, [typingComplete]);

    useEffect(() => {
        if (typingComplete && ctaContainerRef.current) {
            gsap.to(ctaContainerRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "back.out(0.5)",
            });
        }
    }, [typingComplete]);

    const renderTypedText = () => {
        const csavLength = 4;
        if (typedText.length <= csavLength) {
            return <span className="text-emerald-800 dark:text-emerald-600">{typedText}</span>;
        }
        const csavPart = typedText.slice(0, csavLength);
        const restPart = typedText.slice(csavLength);
        return (
            <>
                <span className="text-emerald-800 dark:text-emerald-600">{csavPart}</span>
                <span className="text-gray-800 dark:text-gray-100">{restPart}</span>
            </>
        );
    };

    const handleMouseEnter = (target: HTMLElement, scale = 1.05) => {
        gsap.to(target, { scale, duration: 0.3, ease: "back.out(0.5)", y: -2 });
    };
    const handleMouseLeave = (target: HTMLElement) => {
        gsap.to(target, { scale: 1, duration: 0.3, ease: "power2.out", y: 0 });
    };

    useEffect(() => {
        const blobs = document.querySelectorAll('.animated-blob');
        if (!blobs.length) return;
        blobs.forEach((blob, i) => {
            gsap.to(blob, {
                x: i % 2 === 0 ? 40 : -30,
                y: i % 3 === 0 ? 30 : -20,
                rotation: i * 10,
                duration: 12 + i * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        });
    }, []);

    return (
        <>
            <Head title="CSAV SDG">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
            </Head>

            {showIntro && (
                <div
                    ref={introContainerRef}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-950 overflow-hidden rounded-3xl"
                >
                    <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
                        <div className="absolute rounded-full bg-cyan-400/30 blur-xl animate-water-ripple"></div>
                        <div className="absolute rounded-full bg-sky-500/20 blur-2xl animate-water-ripple-delayed"></div>
                    </div>
                    <img
                        ref={introLogoRef}
                        src="/csav-logo.svg"
                        alt="CSAV Logo"
                        className="relative z-10 w-32 h-32 object-contain"
                    />
                    <p
                        ref={introTextRef}
                        className="relative z-10 mt-6 text-white text-lg md:text-xl lg:text-2xl font-['Inter'] font-semibold tracking-wide"
                    >
                        Colegio de Sta. Ana de Victorias, Inc.
                    </p>
                </div>
            )}

            <div
                ref={mainContainerRef}
                className="relative h-screen w-full overflow-hidden bg-white font-['Inter'] text-gray-800 dark:bg-gray-900 dark:text-gray-100 opacity-0 invisible"
            >
                <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ background: 'transparent' }} />

                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="animated-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-100/40 blur-3xl dark:bg-green-900/20"></div>
                    <div className="animated-blob absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-orange-100/40 blur-3xl dark:bg-orange-900/20"></div>
                    <div className="animated-blob absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-100/30 blur-3xl dark:bg-yellow-900/15"></div>
                </div>

                <main className="relative z-20 flex h-full w-full flex-col items-center justify-start px-6 py-4 sm:px-8">
                    <div className="flex h-full w-full max-w-5xl flex-col items-center justify-start">
                        <div className="w-full text-center">
                            <Link
                                ref={logoLinkRef}
                                href="/"
                                className="inline-block"
                                onMouseEnter={(e) => handleMouseEnter(e.currentTarget, 1.05)}
                                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                            >
                                <img src='/csav-logo.svg' alt="CSAV Logo" className="mt-15 h-24 w-auto sm:h-28 md:h-32 object-contain mx-auto" />
                            </Link>
                        </div>

                        <div className="flex-grow w-full flex flex-col justify-center items-center">
                            <div ref={titleRef} className="text-center max-w-4xl mx-auto mb-8 md:mb-12">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight">
                                    {renderTypedText()}
                                    {!typingComplete && (
                                        <span className="inline-block w-[2px] h-[0.8em] bg-emerald-600 ml-1 animate-pulse"></span>
                                    )}
                                    {typingComplete && showCursor && (
                                        <span className="inline-block w-[2px] h-[0.8em] bg-emerald-600 ml-1"></span>
                                    )}
                                </h1>
                                <p ref={descriptionRef} className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                    Streamline compliance, track performance, and achieve your goals – all in one place. Modern compliance monitoring for educational institutions.
                                </p>
                            </div>

                            <div ref={ctaContainerRef} className="w-full max-w-2xl opacity-0">
                                <div className="text-center">
                                    <div className="mx-auto max-w-3xl">
                                        <div className="flex flex-wrap items-center justify-center gap-4">
                                            <Link
                                                href={login()}
                                                className="rounded-full bg-emerald-700 px-8 py-4 text-lg font-medium text-white shadow-md transition-all hover:bg-emerald-800 hover:shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700"
                                                onMouseEnter={(e) => handleMouseEnter(e.currentTarget, 1.05)}
                                                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                                            >
                                                Log in to get started
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div ref={copyrightRef} className="mt-5 w-full text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            <p>© {new Date().getFullYear()} CSAV Compliance Monitoring Tool. All rights reserved.</p>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes water-ripple {
                    0% { width: 0px; height: 0px; opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { width: 300px; height: 300px; opacity: 0; }
                }
                @keyframes water-ripple-delayed {
                    0% { width: 0px; height: 0px; opacity: 0.5; }
                    50% { opacity: 0.2; }
                    100% { width: 500px; height: 500px; opacity: 0; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-water-ripple { animation: water-ripple 2.4s ease-out forwards; }
                .animate-water-ripple-delayed { animation: water-ripple-delayed 2.4s ease-out forwards; animation-delay: 0.3s; }
                .animate-pulse { animation: blink 0.8s step-end infinite; }
            `}</style>
        </>
    );
}