import UserController from '@/actions/App/Http/Controllers/UserController';
import { CustomToast } from '@/components/custom-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';

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

// Role → token-based badge style
function RoleBadge({ role }: { role: string }) {
    const map: Record<string, string> = {
        admin: 'bg-accent/10 text-accent border border-accent/30',
        'project-manager': 'bg-primary/10 text-primary border border-primary/30',
        staff: 'bg-secondary/60 text-secondary-foreground border border-secondary',
        committee: 'bg-muted text-muted-foreground border border-border',
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${map[role] ?? 'bg-muted text-muted-foreground border border-border'}`}>
            {role.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/settings/users' },
];

export default function Index({ staffUsers }: IndexProps) {
    const { auth } = usePage().props as any;
    const currentUser = auth.user;

    const hasRole = (roles: string[]) =>
        currentUser?.roles?.some((r: { name: string }) => roles.includes(r.name)) ?? false;

    const handleDelete = (userSlug: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/settings/users/${userSlug}/delete`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users Management" />

            <style>{`
                @keyframes cardFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .user-card {
                    animation: cardFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .page-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
                .user-card:hover .avatar-ring { box-shadow: 0 0 0 3px var(--color-secondary, #fdfa00); }
            `}</style>

            <div className="min-h-screen py-8 md:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <CustomToast />
                    {/* ── Header ── */}
                    <div className="page-header mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg">
                                <Users className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Management
                                </p>
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                    Team{' '}
                                    <span className="relative inline-block text-primary">
                                        Members
                                        <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-secondary" />
                                    </span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <p className="text-sm text-muted-foreground">
                                <span className="mr-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-black text-secondary-foreground">
                                    {staffUsers.length}
                                </span>
                                members total
                            </p>
                            <Link
                                href={UserController.create().url}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                           active:scale-95 hover:brightness-110 hover:shadow-lg
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add User
                            </Link>
                        </div>
                    </div>

                    {/* ── Empty state ── */}
                    {staffUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <Users className="h-8 w-8 text-primary/50" />
                            </div>
                            <p className="text-lg font-semibold text-muted-foreground">No team members yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Add members to get started.</p>
                            <Link
                                href={UserController.create().url}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground
                                           transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Add First Member
                            </Link>
                        </div>
                    ) : (
                        /* ── User grid: 1 col → 2 col → 3 col ── */
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {staffUsers.map((user, index) => (
                                <div
                                    key={user.id}
                                    className="user-card group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-md ring-1 ring-border transition-shadow duration-200 hover:shadow-xl"
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    {/* 10% accent top bar */}
                                    <div className="h-1 w-full bg-accent" />

                                    <div className="flex flex-1 flex-col items-center p-6">
                                        {/* Avatar */}
                                        <div className="relative mb-4">
                                            <div
                                                className="avatar-ring h-20 w-20 overflow-hidden rounded-full bg-primary transition-all duration-300"
                                            >
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <span className="text-2xl font-black text-primary-foreground">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online indicator */}
                                            {user.is_online && (
                                                <span className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5 rounded-full border-2 border-card bg-green-400" />
                                            )}
                                        </div>

                                        {/* Name + email */}
                                        <Link
                                            href={UserController.show(user.id).url}
                                            className="text-base font-bold text-foreground transition-colors hover:text-primary"
                                        >
                                            {user.name}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>

                                        {/* Roles */}
                                        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                                            {user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <RoleBadge key={role.name} role={role.name} />
                                                ))
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground">No role assigned</span>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        <div className="my-4 h-px w-full bg-border" />

                                        {/* Actions — only for admin / project-manager */}
                                        {hasRole(['admin', 'project-manager']) && (
                                            <div className="flex w-full gap-2">
                                                {/* View */}
                                                <Link
                                                    href={UserController.show(user.id).url}
                                                    className="flex-1 rounded-xl border-2 border-border py-2 text-center text-xs font-semibold text-muted-foreground transition-all duration-150
                                                               hover:border-secondary hover:bg-secondary hover:text-secondary-foreground
                                                               active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                                                >
                                                    View
                                                </Link>

                                                {/* Edit */}
                                                <Link
                                                    href={`/settings/users/${user.user_slug}/edit`}
                                                    className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all duration-150
                                                               hover:brightness-110 hover:shadow-md active:scale-95
                                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                                                    aria-label={`Edit ${user.name}`}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(user.user_slug)}
                                                    className="inline-flex items-center justify-center rounded-xl bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-all duration-150
                                                               hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-95
                                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                                                    aria-label={`Delete ${user.name}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}