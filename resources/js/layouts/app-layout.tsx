import NotificationBell from '@/components/notification-bell';
import { ToastProvider } from '@/components/toast';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <>
        <ToastProvider />
        <AppLayoutTemplate 
            breadcrumbs={breadcrumbs} 
            headerActions={<NotificationBell />}  
            {...props}
        >
            {children}  {/* Only children should be here */}
        </AppLayoutTemplate>
    </>
);