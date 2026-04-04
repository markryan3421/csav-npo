import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useEffect, useState, useRef } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const [showTrailer, setShowTrailer] = useState(true);
    const [showMainContent, setShowMainContent] = useState(false);
    const [animatedText, setAnimatedText] = useState({
        schoolName1: '',
        schoolName2: '',
        tagline: ''
    });

    const schoolName1Ref = useRef<HTMLDivElement>(null);
    const schoolName2Ref = useRef<HTMLDivElement>(null);
    const taglineRef = useRef<HTMLDivElement>(null);

    // Split text animation function
    const animateText = (element: HTMLElement, text: string, delay: number = 0) => {
        if (!element) return;
        
        element.innerHTML = '';
        const chars = text.split('');
        
        chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay + index * 0.03}s`;
            element.appendChild(span);
            
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, 50);
        });
    };

    useEffect(() => {
        // Animate text when trailer is visible
        if (showTrailer) {
            const timer1 = setTimeout(() => {
                if (schoolName1Ref.current) {
                    animateText(schoolName1Ref.current, 'Colegio de Sta. Ana', 0.2);
                }
            }, 200);
            
            const timer2 = setTimeout(() => {
                if (schoolName2Ref.current) {
                    animateText(schoolName2Ref.current, 'de Victorias', 0.5);
                }
            }, 500);
            
            const timer3 = setTimeout(() => {
                if (taglineRef.current) {
                    animateText(taglineRef.current, 'Goal Tracking System', 0.8);
                }
            }, 800);
            
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        }
    }, [showTrailer]);

    useEffect(() => {
        // Show trailer for 3 seconds (increased to allow text animation)
        const trailerTimer = setTimeout(() => {
            setShowTrailer(false);
            
            setTimeout(() => {
                setShowMainContent(true);
            }, 300);
        }, 3500);

        return () => clearTimeout(trailerTimer);
    }, []);

    return (
        <>
            <Head title="Welcome | CSAV Goal Tracking System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Trailer Overlay */}
            <div
                className={`
                    fixed inset-0 z-50 flex flex-col items-center justify-center
                    bg-gradient-to-br from-primary via-primary/90 to-primary
                    transition-all duration-1000 ease-in-out
                    ${showTrailer ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}
                `}
            >
                <div className="text-center">
                    {/* Animated Logo - Elegant pulse and glow instead of bounce */}
                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            {/* Pulsing ring effect */}
                            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
                            
                            {/* Glowing orb behind logo */}
                            <div className="absolute -inset-4 rounded-full bg-white/5 blur-xl animate-pulse" style={{ animationDuration: '2s' }} />
                            
                            {/* Logo container with elegant scale animation */}
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl lg:h-40 lg:w-40 animate-in fade-in zoom-in duration-700">
                                <div className="animate-in fade-in zoom-in duration-1000 delay-300">
                                    <AppLogoIcon />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* School Name - Character by character animation */}
                    <div className="mb-4">
                        <div 
                            ref={schoolName1Ref}
                            className="text-3xl font-black tracking-tight text-white lg:text-5xl"
                            style={{ minHeight: '4rem' }}
                        />
                        <div 
                            ref={schoolName2Ref}
                            className="text-2xl font-bold text-white/90 lg:text-3xl mt-2"
                            style={{ minHeight: '3rem' }}
                        />
                    </div>

                    {/* Tagline - Character by character animation */}
                    <div>
                        <div 
                            ref={taglineRef}
                            className="text-base font-medium text-white/80 lg:text-lg"
                            style={{ minHeight: '2rem' }}
                        />
                        <div className="mt-4 flex justify-center">
                            <div className="h-1 w-12 rounded-full bg-white/50 animate-pulse" style={{ animationDuration: '1.5s' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`
                transition-all duration-700 ease-in-out
                ${showMainContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
            `}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <div className="relative overflow-hidden">
                        {/* Animated Background Shapes */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-primary/5 blur-3xl" style={{ animationDuration: '4s' }} />
                            <div className="absolute -right-20 -bottom-20 h-80 w-80 animate-pulse rounded-full bg-accent/5 blur-3xl animation-delay-1000" style={{ animationDuration: '5s' }} />
                            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary/5 blur-3xl animation-delay-2000" style={{ animationDuration: '6s' }} />
                        </div>

                        {/* Hero Section */}
                        <div className="relative z-10 animate-in fade-in slide-in-from-bottom duration-700">
                            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32 lg:px-8">
                                <div className="text-center">
                                    <div className="mb-6 inline-flex animate-in fade-in zoom-in items-center gap-2 rounded-full bg-primary/10 px-4 py-2 animation-delay-200">
                                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-xs font-semibold text-primary">Welcome to CSAV</span>
                                    </div>
                                    
                                    <h1 className="mb-6 animate-in fade-in slide-in-from-bottom text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl animation-delay-300">
                                        Track Your Goals,
                                        <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                            Achieve Excellence
                                        </span>
                                    </h1>
                                    
                                    <p className="mx-auto mb-8 max-w-2xl animate-in fade-in text-base text-muted-foreground lg:text-lg animation-delay-500">
                                        Empower your institution with our comprehensive goal tracking system. 
                                        Monitor progress, collaborate effectively, and drive success across all departments.
                                    </p>
                                    
                                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-in fade-in zoom-in animation-delay-700">
                                        <Link
                                            href={auth.user ? dashboard() : login()}
                                            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/80 px-8 py-3 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
                                        >
                                            <span className="relative">
                                                {auth.user ? 'Go to Dashboard' : 'Get Started'}
                                            </span>
                                        </Link>
                                        <Link
                                            href="#features"
                                            className="rounded-lg border-2 border-primary/20 px-8 py-3 text-base font-semibold text-primary transition-all hover:border-primary hover:bg-primary/5"
                                        >
                                            Learn More
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes fade-in-zoom {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes slide-in-from-left {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slide-in-from-right {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes slide-in-from-bottom {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes zoom-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @keyframes gentle-pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.1;
                        transform: scale(1.1);
                    }
                }
                
                .animate-in {
                    animation-fill-mode: both;
                }
                
                .fade-in {
                    animation-name: fade-in;
                    animation-duration: 0.7s;
                }
                
                .fade-in\\:zoom-in {
                    animation-name: fade-in-zoom;
                    animation-duration: 0.7s;
                }
                
                .slide-in-from-left {
                    animation-name: slide-in-from-left;
                    animation-duration: 0.7s;
                }
                
                .slide-in-from-right {
                    animation-name: slide-in-from-right;
                    animation-duration: 0.7s;
                }
                
                .slide-in-from-bottom {
                    animation-name: slide-in-from-bottom;
                    animation-duration: 0.7s;
                }
                
                .zoom-in {
                    animation-name: zoom-in;
                    animation-duration: 0.5s;
                }
                
                .animation-delay-200 {
                    animation-delay: 200ms;
                }
                
                .animation-delay-300 {
                    animation-delay: 300ms;
                }
                
                .animation-delay-500 {
                    animation-delay: 500ms;
                }
                
                .animation-delay-700 {
                    animation-delay: 700ms;
                }
                
                .animation-delay-1000 {
                    animation-delay: 1000ms;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2000ms;
                }
            `}} />
        </>
    );
}