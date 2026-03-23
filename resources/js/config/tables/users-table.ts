export const UsersTableConfig = {
    columns: [
        { label: 'Name', key: 'name', className: 'border p-4' },
        { label: 'Email', key: 'email', className: 'w-90 p-4' },
        { label: 'Roles', key: 'roles', className: 'border p-4', type: 'multi-values' },
        { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },
    ],
    actions: [
        { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Edit', icon: 'Pencil', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Delete', icon: 'Trash', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    ],
}