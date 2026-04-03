export const GoalsTableConfig = {
    columns: [
        { label: 'Goal Name', key: 'title', className: 'border p-4' },
        { label: 'Status', key: 'status', className: 'capitalize border p-4' },
        { label: 'Progress', key: 'compliance_percentage', className: 'w-90 p-4' },
        { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },
    ],
    actions: [
        { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Edit', icon: 'Pencil', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer', permission: 'edit goal' },
        { label: 'Delete', icon: 'Trash', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer', permission: 'delete goal' },
    ],
}