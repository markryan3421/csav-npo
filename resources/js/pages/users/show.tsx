import UserController from '@/actions/App/Http/Controllers/UserController';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, ShieldCheck, Target, Calendar, Mail, User as UserIcon } from 'lucide-react';

interface Role { name: string; }
interface Sdg { id: number; name: string; }
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

interface ShowUserProps { user: User; }
interface FlashProps extends Record<string, any> {
    flash?: { success?: string; error?: string; }
}

function RoleBadge({ role }: { role: string }) {
    const map: Record<string, string> = {
        admin: 'bg-accent/10 text-accent border border-accent/30',
        'project-manager': 'bg-primary/10 text-primary border border-primary/30',
        staff: 'bg-secondary/60 text-secondary-foreground border border-secondary',
    };
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${map[role] ?? 'bg-muted text-muted-foreground border border-border'}`}>
            {role.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value || 'N/A'}</p>
        </div>
    );
}

export default function ShowUser({ user }: ShowUserProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: UserController.index().url },
        { title: user.name, href: UserController.show(user.id).url },
    ];

    const formatDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    const avatarUrl = user.avatar
        ? user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`
        : null;

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(UserController.destroy(id).url, {
                preserveScroll: true,
                onSuccess: (response: { props: FlashProps }) => {
                    toast.success(response.props.flash?.success || 'User deleted successfully.');
                },
                onError: (error: Record<string, string>) => {
                    toast.error(error?.message || 'Failed to delete user.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} — Profile`} />

            <style>{`
                @keyframes profileReveal {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .profile-section {
                    animation: profileReveal 0.4s cubic-bezier(0.22,1,0.36,1) both;
                }
            `}</style>

            <div className="min-h-screen py-8 md:py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

                    {/* ── Page header ── */}
                    <div className="mb-8 flex items-center justify-between">
                        <Link
                            href={UserController.index().url}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-200
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Users</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {/* Edit */}
                            <Link
                                href={UserController.edit(user.id).url}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200
                                           hover:brightness-110 hover:shadow-md active:scale-95
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </Link>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => handleDelete(user.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition-all duration-200
                                           hover:bg-accent hover:text-accent-foreground hover:shadow-md active:scale-95
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Profile hero card ── */}
                    <div
                        className="profile-section mb-5 overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border"
                        style={{ animationDelay: '0ms' }}
                    >
                        {/* Green header band */}
                        <div className="relative bg-primary px-6 py-8 sm:px-8">
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-secondary shadow-xl">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-primary/80">
                                                <span className="text-3xl font-black text-primary-foreground">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Name + role */}
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl font-extrabold text-primary-foreground">{user.name}</h1>
                                    <p className="text-sm text-primary-foreground/70">{user.email}</p>
                                    <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                                        {user.roles.map((r) => <RoleBadge key={r.name} role={r.name} />)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Info grid ── */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* Basic Info */}
                        <div
                            className="profile-section space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
                            style={{ animationDelay: '80ms' }}
                        >
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Basic Information</h2>
                            </div>
                            <InfoRow label="Full Name" value={user.name} />
                            <InfoRow label="Email Address" value={user.email} />
                            <InfoRow label="Account Created" value={formatDate(user.created_at)} />
                        </div>

                        {/* Roles & Permissions */}
                        <div
                            className="profile-section space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
                            style={{ animationDelay: '120ms' }}
                        >
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Roles & Permissions</h2>
                            </div>

                            <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Assigned Role
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {user.roles.length > 0
                                        ? user.roles.map((r) => <RoleBadge key={r.name} role={r.name} />)
                                        : <span className="text-xs text-muted-foreground italic">No roles assigned</span>
                                    }
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Permissions
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {user.permissions?.length > 0 ? (
                                        user.permissions.map((p) => (
                                            <span
                                                key={p}
                                                className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                            >
                                                {p}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Assigned SDGs — full width */}
                        <div
                            className="profile-section col-span-1 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:col-span-2"
                            style={{ animationDelay: '160ms' }}
                        >
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                    <Target className="h-4 w-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Assigned SDGs</h2>
                                {user.sdgs.length > 0 && (
                                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-secondary-foreground">
                                        {user.sdgs.length}
                                    </span>
                                )}
                            </div>

                            {user.sdgs.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.sdgs.map((sdg) => (
                                        <span
                                            key={sdg.id}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-primary/5 px-3 py-1.5 text-xs font-semibold text-foreground"
                                        >
                                            <span
                                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-black"
                                                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                                            >
                                                {sdg.id}
                                            </span>
                                            {sdg.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No SDGs assigned</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}