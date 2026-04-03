import AppLogoIcon from './app-logo-icon';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    return (
        <div className="flex items-center gap-2 p-5 mx-5 md:-ml-0 lg:mr-5">
            <div className={`
                flex items-center justify-center rounded-md
                ${isExpanded ? 'size-11 -ml-5 transition-all duration-300 ease-in-out' : 'size-7 -ml-6.5 transition-all duration-200 ease-in-out'}
            `}>
                <AppLogoIcon/>
            </div>
            <div className={`
                ps-1
                grid text-left text-sm
                transition-all duration-100 ease-in-out
                whitespace-nowrap
                ${isExpanded 
                    ? 'opacity-100 max-w-[200px] ml-1' 
                    : 'opacity-0 max-w-0 ml-0'
                }
            `}>
                <span className="mb-0.5 -ml-2 leading-tight tracking-tighter inter-bold text-[13px] text-primary font-extrabold">
                    Sta. Ana de Victorias
                </span>
                <span className="-mt-1 truncate leading-tight inter-extrabold text-[12px] -ml-2 tracking-tighter text-accent font-bold">
                    CSAV Inc.
                </span>
                <span className="truncate leading-tight inter-bold text-[12px] -ml-2 tracking-tighter text-black dark:text-white">
                    Goal Tracking System
                </span>
            </div>
        </div>
    );  
}