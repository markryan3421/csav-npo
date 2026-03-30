import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

interface ExtendedAppLayoutProps extends AppLayoutProps {
    headerActions?: React.ReactNode;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions, 
}: ExtendedAppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs}>
                    {headerActions}  {/* Pass headerActions to the header */}
                </AppSidebarHeader>
                {children}
            </AppContent>
        </AppShell>
    );
}