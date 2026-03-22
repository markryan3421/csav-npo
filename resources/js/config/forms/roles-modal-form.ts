import { CirclePlus } from "lucide-react"

export const RolesModalFormConfig = {
    moduleTitle: 'Manage Roles',
    title: 'Create Role',
    description: 'Add a new role to your system.',
    addButton: {
        id: 'add-role',
        label: 'Add Role',
        className: 'bg-primary hover:bg-chart-4 cursor-pointer',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
    },
    fields: [
        {
            id: 'role-label',
            key: 'label',
            name: 'label',
            label: 'Role Label (e.g. Super Admin)',
            placeholder: 'Enter role label',
            type: 'text',
            autocomplete: 'label',
            tabIndex: 1,
        },
        {
            id: 'description',
            key: 'description',
            name: 'description',
            label: 'Description (optional)',
            placeholder: 'Enter role description',
            type: 'textarea',
            autocomplete: 'description',
            tabIndex: 2,
            rows: 2,
        },
        {
            id: 'permissions',
            key: 'permissions',
            name: 'permissions[]',
            label: 'Permissions',
            type: 'grouped-checkboxes',
            tabIndex: 3,
        },
    ],
    buttons: [
        {
            key: 'cancel',
            type: 'button',
            label: 'Close',
            variant: 'ghost',
            className: 'outline cursor-pointer',
        },
        {
            key: 'submit',
            type: 'submit',
            label: 'Save',
            variant: 'default',
            className: 'cursor-pointer',
        }
    ]
}