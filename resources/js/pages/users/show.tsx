import UserController from '@/actions/App/Http/Controllers/UserController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';

interface Role {
    name: string;
}

interface Sdg {
    id: number;
    name: string;
}

interface User {
    id: number;
    user_slug: string;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
    roles: Role[];
    sdgs: Sdg[];
    permissions: string[];
}

interface ShowUserProps {
    user: User;
}

interface FlashProps extends Record<string, any> {
    flash?: {
        success?: string;
        error?: string;
    }
}

export default function ShowUser({ user }: ShowUserProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Build the full URL for the avatar
    const avatarUrl = user.avatar
        ? user.avatar.startsWith('http')
            ? user.avatar
            : `/storage/${user.avatar}`
        : null;

    const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            const deleteUrl = UserController.destroy(id).url;
            router.delete(deleteUrl, {
                preserveScroll: true,
                onSuccess: (response: { props: FlashProps }) => {
                    const successMessage = response.props.flash?.success || 'User deleted successfully.'
                    toast.success(successMessage);
                },
                onError: (error: Record<string, string>) => {
                    const errorMessage = error?.message || 'Failed to delete user.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Create User" />
            <div className="py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="p-6 bg-white shadow rounded-xl">
                        <div className="p-8">
                            {/* Back and Edit Buttons */}
                            <div className="flex justify-between items-center mb-5">
                                <Button onClick={() => handleDelete(user.id)}>
                                    Delete
                                </Button>
                                <Link
                                    href={UserController.index().url}
                                    className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-1"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Back to Users
                                </Link>

                                <h2 className="font-semibold text-2xl text-black leading-tight">User Profile</h2>

                                <Link
                                    href={UserController.edit(user.id).url}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    Edit Profile
                                </Link>
                            </div>

                            {/* Profile Card */}
                            <div className="bg-gray-50 rounded-lg p-8 shadow mb-10">
                                <div className="flex items-center space-x-6 mb-6">
                                    <div className="flex-shrink-0">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="avatar"
                                                className="h-20 w-20 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 rounded-full bg-indigo-500 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{initial}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                                        <p className="text-gray-500 text-sm">{user.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="bg-white p-6 rounded-lg border">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                                        <div className="space-y-4 text-sm text-gray-700">
                                            <div>
                                                <p className="text-gray-500">Name</p>
                                                <p className="font-medium">{user.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium">{user.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Account Created</p>
                                                <p className="font-medium">{formatDate(user.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Roles & Permissions */}
                                    <div className="bg-white p-6 rounded-lg border">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Roles & Permissions</h3>
                                        <div className="mb-4">
                                            <p className="text-gray-500 text-sm mb-1">Assigned Roles</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <span
                                                            key={role.name}
                                                            className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {role.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No roles assigned</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-gray-500 text-sm mb-1">Permissions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.permissions && user.permissions.length > 0 ? (
                                                    user.permissions.map((permission) => (
                                                        <span
                                                            key={permission}
                                                            className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                                        >
                                                            {permission}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No permissions assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SDG Assignment Section */}
                                <div className="mt-6 bg-white p-6 rounded-lg border">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Assigned SDGs</h3>
                                    <div className="space-y-4">
                                        {user.sdgs && user.sdgs.length > 0 ? (
                                            user.sdgs.map((sdg) => (
                                                <span
                                                    key={sdg.id}
                                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                >
                                                    SDG {sdg.id}: {sdg.name}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-500">No SDGs assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}