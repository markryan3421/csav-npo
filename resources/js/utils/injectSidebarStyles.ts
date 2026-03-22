// ── Inject keyframes once ─────────────────────────────────────────────────────
export const injectSidebarStyles = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sdg-sidebar-styles')) return;
    const style = document.createElement('style');
    style.id = 'sdg-sidebar-styles';
    style.textContent = `
        @keyframes sdgGroupReveal {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes sdgItemSlide {
            from { opacity: 0; transform: translateX(-8px); }
            to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes sdgLabelPop {
            from { opacity: 0; transform: translateX(-4px) scaleX(0.97); }
            to   { opacity: 1; transform: translateX(0)    scaleX(1);    }
        }
        .sdg-subnav-group {
            animation: sdgGroupReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .sdg-subnav-label {
            animation: sdgLabelPop 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
        }
        .sdg-subnav-item {
            animation: sdgItemSlide 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        /* Stagger each nav item */
        .sdg-subnav-item:nth-child(1) { animation-delay: 0.08s; }
        .sdg-subnav-item:nth-child(2) { animation-delay: 0.13s; }
        .sdg-subnav-item:nth-child(3) { animation-delay: 0.18s; }
        .sdg-subnav-item:nth-child(4) { animation-delay: 0.23s; }
        .sdg-subnav-item:nth-child(5) { animation-delay: 0.28s; }

        /* Active indicator line */
        .sdg-nav-active-item {
            position: relative;
        }
        .sdg-nav-active-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            border-radius: 0 3px 3px 0;
            background-color: #eb3d00;
        }
    `;
    document.head.appendChild(style);
};