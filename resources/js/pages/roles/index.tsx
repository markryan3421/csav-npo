import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { CustomTable } from '@/components/custom-table';
import { CustomModalForm } from '@/components/custom-modal-form';
import { useForm } from '@inertiajs/react';
import React from 'react';
import { CustomToast, toast } from '@/components/custom-toast';
import RoleController from '@/actions/App/Http/Controllers/RoleController';
import { RolesModalFormConfig } from '@/config/forms/roles-modal-form';
import { RolesTableConfig } from '@/config/tables/roles-table';
import { CustomHeader } from '@/components/custom-header';
import { Shield, ShieldHalf, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Manage Roles',
        href: '/roles',
    },
];

// Define the Product interface, representing the structure of a product object
// This helps with type-checking and autocompletion in TypeScript
interface Role {
    id: number;
    name: string;
    description: string;
}

interface Permission {
    name: string;
    label: string;
    module: string;
}

// Define the LinkProps interface for pagination links
interface LinkProps {
    // From 'links' array
    active: boolean;
    label: string;
    url: string | null;
}

// Define the CategoryPagination interface for paginated product data
interface RolePagination {
    // This are the list of arrays inside the 'products' object
    data: Role[]; // Array of Product objects
    links: LinkProps[]; // Array of pagination link objects
    from: number;
    to: number;
    total: number;
}

// Define the FilterProps interface for search filters
interface FilterProps {
    search: string;
    perPage: string;
}

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

// Define the props for the Index component
// Get the 'products' and 'filters' in the form of object array - compacted from the controller
interface IndexProps {
    roles: RolePagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    permissions: Record<string, Permission[]>;
}

export default function Index({ roles, permissions }: IndexProps) {
    console.log("Role data", roles.data);

    // This will display flash message from the backend (success/error)
    const [modalOpen, setModalOpen] = React.useState(false);
    const [mode, setMode] = React.useState<'create' | 'view' | 'edit'>('create');
    const [selectedCategory, setSelectedCategory] = React.useState<any>(null);
    // console.log(permissions);

    const { data, setData, errors, processing, reset, post, put } = useForm<{
        label: string;
        description: string;
        permissions: string[];
        _method: string;
    }>({
        label: '',
        description: '',
        permissions: [],
        _method: 'POST',
    });

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const deleteUrl = RoleController.destroy(id).url;
            router.delete(deleteUrl, {
                preserveScroll: true,
                onSuccess: (response: { props: FlashProps }) => {
                    const successMessage = response.props.flash?.success || 'Category deleted successfully.'
                    toast.success(successMessage);
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    const errorMessage = error?.message || 'Failed to delete category.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // console.log('Form data:', data); return;

        if (mode === 'edit' && selectedCategory) {
            setData('_method', 'PUT');

            put(RoleController.update(selectedCategory.id).url, {
                forceFormData: true,
                onSuccess: (response: { props: FlashProps }) => {
                    toast.success(response.props.flash?.success || 'Role updated successfully.');
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    toast.error(error?.message || 'Failed to update role.');
                },
            })
        } else {
            post(RoleController.store().url, {
                onSuccess: (response: { props: FlashProps }) => {
                    toast.success(response.props.flash?.success || 'Role created successfully.');
                    closeModal();
                },
                onError: (error: Record<string, string>) => {
                    toast.error(error?.message || 'Failed to create role.');
                },
            })
        }
    };

    // Will trigger after submitting the data
    const closeModal = () => {
        // Reset the input fields, remove the values
        reset();
        setMode('create');
        setSelectedCategory(null);
        setModalOpen(false);
    };

    // Will either close or open the modal
    const handleModalToggle = (open: boolean) => {
        setModalOpen(open);
        if (!open) {
            setMode('create');
            setSelectedCategory(null);
            reset();
        }
    };

    // Modal for creating/viewing/editing category
    const openModal = (mode: 'create' | 'view' | 'edit', category?: any) => {
        setMode(mode);

        if (category) {
            Object.entries(category).forEach(([key, value]) => {
                if (key === 'permissions' && Array.isArray(value)) {
                    setData(
                        'permissions',
                        value.map((permission: any) => permission.name),
                    );
                } else {
                    // Fetch the permission names from database
                    setData(key as keyof typeof data, (value as string || null) ?? '');
                }
            });

            setSelectedCategory(category);
        }
        // console.log('Data', data);
        setModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Category Management" />
            <CustomToast />
            <div className="min-h-screen py-8 md:py-12">
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                {/* ── Header ── */}
                <div className="page-header mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg">
                            <Shield className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                Management
                            </p>
                            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                List of{' '}
                                <span className="relative inline-block text-primary">
                                    Roles
                                    <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-secondary" />
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Custom Modal Form */}
                <div className="ml-auto">
                    <CustomModalForm
                        addButton={RolesModalFormConfig.addButton}
                        title={mode === 'view' ? 'View Role' : (mode === 'edit' ? 'Update Role' : RolesModalFormConfig.title)}
                        description={RolesModalFormConfig.description}
                        fields={RolesModalFormConfig.fields}
                        buttons={RolesModalFormConfig.buttons}
                        data={data}
                        setData={setData}
                        errors={errors}
                        processing={processing}
                        handleSubmit={handleSubmit}
                        open={modalOpen}
                        onOpenChange={handleModalToggle}
                        mode={mode}
                        extraData={permissions}
                    />
                </div>

                <CustomTable
                    columns={RolesTableConfig.columns}
                    actions={RolesTableConfig.actions}
                    data={roles.data}
                    from={roles.from}
                    onDelete={handleDelete}
                    onView={(category) => openModal('view', category)}
                    onEdit={(category) => openModal('edit', category)}
                    isModal={true}
                />
                </div>
                
            </div>
        </AppLayout>
    );
}