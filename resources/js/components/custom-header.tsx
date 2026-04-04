import React, { useEffect, useRef } from 'react';

interface CustomHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string; // Made optional to match your style
  className?: string;
  badgeText?: string;
  showUnderline?: boolean;
  underlineText?: string;
  animate?: boolean;
  splitText?: boolean;
}

export const CustomHeader = ({ 
  icon, 
  title, 
  description, 
  className = '',
  badgeText,
  showUnderline = false,
  underlineText,
  animate = true,
  splitText = false
}: CustomHeaderProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  // Split text animation for title
  useEffect(() => {
    if (splitText && titleRef.current && animate) {
      const element = titleRef.current;
      const originalText = title;
      
      element.innerHTML = '';
      
      const chars = originalText.split('');
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(20px)';
        span.style.transition = `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.03}s`;
        element.appendChild(span);
        
        setTimeout(() => {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0)';
        }, 100);
      });

      return () => {
        element.innerHTML = originalText;
      };
    }
  }, [splitText, title, animate]);

  // Animate underline
  useEffect(() => {
    if (showUnderline && underlineRef.current && animate) {
      underlineRef.current.style.width = '0%';
      setTimeout(() => {
        if (underlineRef.current) {
          underlineRef.current.style.transition = 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          underlineRef.current.style.width = '100%';
        }
      }, 200);
    }
  }, [showUnderline, animate]);

  return (
    <div className={`
      flex items-center gap-4
      ${animate ? 'animate-in fade-in slide-in-from-bottom duration-500' : ''}
      ${className}
    `}>
      {/* Icon Container */}
      <div className={`
        flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg
        ${animate ? 'animate-in fade-in zoom-in duration-500 delay-200' : ''}
      `}>
        <div className="h-6 w-6 text-primary-foreground">
          {icon}
        </div>
      </div>

      {/* Text Content */}
      <div>
        {/* Badge */}
        {badgeText && (
          <p className={`
            text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground
            ${animate ? 'animate-in fade-in zoom-in duration-500 delay-300' : ''}
          `}>
            {badgeText}
          </p>
        )}

        {/* Title */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <div className="relative">
            <h1 
              ref={titleRef}
              className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
            >
              {!splitText && title}
            </h1>
          </div>

          {/* Underline Text */}
          {showUnderline && underlineText && (
            <div className="relative inline-block">
              <span className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                {underlineText}
              </span>
              <span 
                ref={underlineRef}
                className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-secondary"
                style={{ transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </div>
          )}
        </div>

        {/* Description - Made optional */}
        {description && (
          <p className={`
            mt-1 text-sm text-muted-foreground
            ${animate ? 'animate-in fade-in slide-in-from-bottom duration-500 delay-400' : ''}
          `}>
            {description}
          </p>
        )}
      </div>

      {/* Global styles for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
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
        
        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
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
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
          animation-duration: 0.5s;
        }
        
        .fade-in\\:zoom-in {
          animation-name: fade-in-zoom;
          animation-duration: 0.5s;
        }
        
        .slide-in-from-bottom {
          animation-name: slide-in-from-bottom;
          animation-duration: 0.5s;
        }
        
        .zoom-in {
          animation-name: zoom-in;
          animation-duration: 0.4s;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}} />
    </div>
  );
};