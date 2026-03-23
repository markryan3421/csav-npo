import UserController from '@/actions/App/Http/Controllers/UserController';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// Define the shape of a user (adjust as needed)
interface User {
    id: number;
    user_slug: string;
    name: string;
    email: string;
    avatar: string | null;
    is_online: boolean;
    roles: { name: string }[];
}

interface IndexProps {
    staffUsers: User[];
}

export default function Index({ staffUsers }: IndexProps) {
    // Get the current authenticated user from shared props
    const { auth } = usePage().props as any;
    const currentUser = auth.user;
    // Helper to check if current user has any of the given roles
    const hasRole = (roles: string[]) => {
        if (!currentUser?.roles) return false;
        return currentUser.roles.some((role: { name: string }) => roles.includes(role.name));
    };

    const handleDelete = (userSlug: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/settings/users/${userSlug}/delete`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Optionally show a toast
                },
            });
        }
    };

    return (
        <>
            <AppLayout>
                <Head title="Create User" />
                <div className="py-8">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        {/* Header Section */}
                        <div className="flex flex-col items-start justify-between mb-8 space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                            <div>
                                <h1 className="text-2xl font-bold text-white sm:text-3xl">Users Management</h1>
                                <p className="mt-1 text-sm text-gray-400">Manage your team members and their permissions</p>
                            </div>
                            <Link href={UserController.create().url} className="bg-primary hover:bg-chart-4 cursor-pointer">
                                + Add User
                            </Link>
                        </div>

                        {/* Team Section */}
                        <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
                            <div className="px-6 py-8">
                                <div className="max-w-3xl mx-auto text-center mb-12">
                                    <h2 className="text-2xl font-bold text-white sm:text-3xl">Team Members</h2>
                                    <p className="mt-2 text-gray-400">Your organization's staff and their roles</p>
                                </div>

                                {/* Grid Layout */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {staffUsers.length === 0 ? (
                                        <div className="col-span-full py-12 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <h3 className="mt-4 text-lg font-medium text-gray-300">No team members found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Add new members to get started</p>
                                            <div className="mt-6">
                                                <Link
                                                    href={UserController.create().url}
                                                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/50"
                                                >
                                                    Create First User
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        staffUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="overflow-hidden transition-all duration-200 bg-gray-700 rounded-xl hover:bg-gray-600 group border border-gray-600 hover:border-gray-500"
                                            >
                                                <div className="p-6">
                                                    {/* Avatar */}
                                                    <div className="relative mx-auto w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center mb-4 overflow-hidden">
                                                        {user.avatar ? (
                                                            <img
                                                                src={user.avatar}
                                                                alt="avatar"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-4xl font-bold text-white">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                        {user.is_online && (
                                                            <span className="absolute bottom-2 right-2 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-gray-700"></span>
                                                        )}
                                                    </div>

                                                    {/* User Info */}
                                                    <div className="text-center">
                                                        <Link
                                                            href={UserController.show(user.id).url}
                                                            className="text-lg font-medium text-white hover:text-indigo-400 transition-colors"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                        <p className="mt-1 text-sm text-gray-300">{user.email}</p>

                                                        {/* Roles */}
                                                        <div className="mt-3">
                                                            {user.roles.length > 0 ? (
                                                                <div className="flex flex-wrap justify-center gap-2">
                                                                    {user.roles.map((role) => {
                                                                        let roleClass = '';
                                                                        if (role.name === 'admin') {
                                                                            roleClass = 'bg-purple-900/30 text-purple-300 border border-purple-500';
                                                                        } else if (role.name === 'project-manager') {
                                                                            roleClass = 'bg-blue-900/30 text-blue-300 border border-blue-500';
                                                                        } else if (role.name === 'staff') {
                                                                            roleClass = 'bg-green-900/30 text-green-300 border border-green-500';
                                                                        } else {
                                                                            roleClass = 'bg-gray-600 text-gray-300 border border-gray-500';
                                                                        }
                                                                        return (
                                                                            <span key={role.name} className={`px-3 py-1 text-xs font-medium rounded-full ${roleClass}`}>
                                                                                {role.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">No role assigned</span>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons (only for users with admin or project-manager roles) */}
                                                        {hasRole(['admin', 'project-manager']) && (
                                                            <div className="mt-4 flex justify-center space-x-3">
                                                                <Link
                                                                    href={`/settings/users/${user.user_slug}/edit`}
                                                                    className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-indigo-500/30"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                    </svg>
                                                                    Edit
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(user.user_slug)}
                                                                    className="inline-flex items-center px-3.5 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 hover:shadow-red-500/30"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    );
}