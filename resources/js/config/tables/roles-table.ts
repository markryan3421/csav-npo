export const RolesTableConfig = {
    columns: [
        { label: 'Role Name', key: 'name', className: 'border p-4' },
        { label: 'Description', key: 'description', className: 'w-90 p-4' },
        { label: 'Permissions', key: 'permissions', className: 'border p-4', type: 'multi-values' },
        { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },
    ],
    actions: [
        { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Edit', icon: 'Pencil', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Delete', icon: 'Trash', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    ],
}