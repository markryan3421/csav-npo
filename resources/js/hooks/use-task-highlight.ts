import { useEffect } from 'react';

/**
 * useTaskHighlight
 *
 * Drop this hook into your goal show page. On mount it reads the URL hash
 * (e.g. #task-create-q1-report), finds the matching element by id, scrolls
 * to it smoothly, then briefly applies a highlight ring so the user knows
 * exactly which task was linked from the notification.
 *
 * The highlight classes are added via JS so they work with Tailwind's JIT
 * without needing to safelist anything — we toggle a plain CSS class that
 * you define once in your global stylesheet (see below).
 *
 * Usage in your goal show page:
 *
 *   import { useTaskHighlight } from '@/hooks/use-task-highlight';
 *
 *   export default function GoalShow({ goal }) {
 *       useTaskHighlight();
 *       ...
 *   }
 *
 *   Each task card/row must have:
 *       id={`task-${task.slug}`}
 *
 * Add this once to your global CSS (resources/css/app.css):
 *
 *   .task-highlight {
 *       outline: 2px solid theme('colors.primary.DEFAULT');  // or any color
 *       outline-offset: 2px;
 *       background-color: theme('colors.primary.DEFAULT' / 8%);
 *       transition: outline 0.3s ease, background-color 0.3s ease;
 *   }
 */
export function useTaskHighlight(scrollDelay = 120): void {
    useEffect(() => {
        const hash = window.location.hash; // e.g. "#task-create-q1-report"
        if (!hash.startsWith('#task-')) return;

        const elementId = hash.slice(1); // strip the leading "#"

        // Give the page a moment to finish rendering before we scroll
        const timer = setTimeout(() => {
            const el = document.getElementById(elementId);
            if (!el) return;

            // Scroll the element into view
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add the highlight class
            el.classList.add('task-highlight');

            // Remove it after 2.5 s so the effect is temporary
            const cleanup = setTimeout(() => {
                el.classList.remove('task-highlight');
            }, 2500);

            return () => clearTimeout(cleanup);
        }, scrollDelay);

        return () => clearTimeout(timer);
    }, []);
}