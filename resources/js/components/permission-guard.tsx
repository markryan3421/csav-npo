import { usePage } from '@inertiajs/react';
import { hasPermission } from '@/utils/authorization';
import { ReactNode } from 'react';

interface PermissionGuardProps {
    permission: string;
    fallback?: ReactNode;
    children: ReactNode;
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
    const { auth } = usePage().props as any;
    const permissions = auth.permissions;

    if (hasPermission(permissions, permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}