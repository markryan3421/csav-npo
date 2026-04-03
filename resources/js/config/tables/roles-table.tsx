import { permission } from "process";

export const RolesTableConfig = {
    columns: [
        { label: 'Role Name', key: 'name', className: 'border p-4' },
        { label: 'Description', key: 'description', className: 'w-90 p-4' },
        { 
            label: 'Permissions', 
            key: 'permissions', 
            className: 'border p-4',
            render: (row: any) => {
                // Check if permissions exist and is an array
                if (!row.permissions || !Array.isArray(row.permissions)) {
                    return '—';
                }
                
                if (row.permissions.length === 0) {
                    return '—';
                }
                
                // Show first 3 permissions as badges
                const displayPermissions = row.permissions.slice(0, 3);
                const remainingCount = row.permissions.length - 3;
                
                return (
                    <div className="flex flex-wrap gap-1">
                        {displayPermissions.map((permission: any, idx: number) => (
                            <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                                {permission.label || permission.name}
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                +{remainingCount}
                            </span>
                        )}
                    </div>
                );
            }
        },
        { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },
    ],
    actions: [
        { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Edit', icon: 'Pencil', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer', permission: 'edit role' },
        { label: 'Delete', icon: 'Trash', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer', permission: 'delete role' },
    ],
}