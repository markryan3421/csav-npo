import { Head, useForm } from '@inertiajs/react';
import { ChevronsUpDown, ImagePlus, UserPlus, ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import UserController from '@/actions/App/Http/Controllers/UserController';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';

interface Role { id: number; name: string; }
interface Sdg { id: number; name: string; }
interface CreateUserProps { roles: Role[]; sdgs: Sdg[]; }

// Reusable section card
function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; index?: number;
}) {
    return (
        <div
            className="form-section space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            {children}
        </div>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/settings/users' },
    { title: 'Create User', href: '/settings/users/create' },
];

export default function CreateUser({ roles, sdgs }: CreateUserProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        avatar: null as File | null,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        sdgs: [] as number[],
    });

    const [sdgOpen, setSdgOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(UserController.store().url, {
            forceFormData: true,
            onSuccess: () => { toast.success('User created successfully.'); reset(); setPreview(null); },
            onError: (error: Record<string, string>) => {
                toast.error(error?.message || 'Please fix the errors below.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <UserPlus className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Management</p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">Create User</h1>
                            </div>
                        </div>

                        <Link
                            href={UserController.index().url}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-200
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* 1. Avatar */}
                        <FormSection icon={ImagePlus} title="Profile Photo" index={0}>
                            <div
                                className="cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border transition-all duration-200 hover:border-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {preview ? (
                                    <div className="relative">
                                        <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/70 opacity-0 transition-opacity hover:opacity-100">
                                            <p className="text-sm font-bold text-primary-foreground">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <ImagePlus className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">Click to upload</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                                    </div>
                                )}
                            </div>
                            <input ref={fileInputRef} onChange={handleFileUpload} type="file" accept="image/*" className="sr-only" />
                            <InputError message={errors.avatar as string} />
                        </FormSection>

                        {/* 2. Account Details */}
                        <FormSection icon={UserPlus} title="Account Details" index={1}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-sm font-semibold">
                                        <span className="text-accent">* </span>Full Name
                                    </Label>
                                    <Input
                                        id="name" value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="John Doe" autoFocus disabled={processing}
                                        className="h-11 rounded-xl border-2 focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-semibold">
                                        <span className="text-accent">* </span>Email
                                    </Label>
                                    <Input
                                        id="email" type="email" value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="john@example.com" disabled={processing}
                                        className="h-11 rounded-xl border-2 focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-sm font-semibold">
                                        <span className="text-accent">* </span>Password
                                    </Label>
                                    <Input
                                        id="password" type="password" value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        disabled={processing}
                                        className="h-11 rounded-xl border-2 focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="password_confirmation" className="text-sm font-semibold">
                                        <span className="text-accent">* </span>Confirm Password
                                    </Label>
                                    <Input
                                        id="password_confirmation" type="password" value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        disabled={processing}
                                        className="h-11 rounded-xl border-2 focus:border-primary focus:ring-0 focus-visible:ring-2 focus-visible:ring-accent"
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>
                            </div>
                        </FormSection>

                        {/* 3. Role & SDGs */}
                        <FormSection icon={UserPlus} title="Role & SDG Assignment" index={2}>
                            {/* Role */}
                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Role
                                </Label>
                                <Select value={data.role} onValueChange={(v) => setData('role', v)} disabled={processing}>
                                    <SelectTrigger className="h-11 rounded-xl border-2 focus:border-primary">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role} />
                            </div>

                            {/* SDGs multi-select */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">SDGs</Label>
                                <Popover open={sdgOpen} onOpenChange={setSdgOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={processing}
                                            className="inline-flex h-11 w-full items-center justify-between rounded-xl border-2 border-border bg-background px-3 text-sm transition-all hover:border-primary disabled:opacity-50"
                                        >
                                            <span className={data.sdgs.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                                                {data.sdgs.length === 0 ? 'Select SDGs…' : `${data.sdgs.length} selected`}
                                            </span>
                                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search SDGs…" />
                                            <CommandList>
                                                <CommandEmpty>No SDGs found.</CommandEmpty>
                                                <CommandGroup>
                                                    {sdgs.map((sdg) => {
                                                        const selected = data.sdgs.includes(sdg.id);
                                                        return (
                                                            <CommandItem
                                                                key={sdg.id}
                                                                value={sdg.name}
                                                                onSelect={() =>
                                                                    setData('sdgs', selected
                                                                        ? data.sdgs.filter((id) => id !== sdg.id)
                                                                        : [...data.sdgs, sdg.id]
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox checked={selected} className="pointer-events-none data-[state=checked]:border-primary data-[state=checked]:bg-primary" />
                                                                    <span>{sdg.name}</span>
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {/* Selected SDG chips */}
                                {data.sdgs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {data.sdgs.map((id) => {
                                            const sdg = sdgs.find((s) => s.id === id);
                                            return sdg ? (
                                                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black text-secondary-foreground">
                                                    {sdg.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('sdgs', data.sdgs.filter((i) => i !== id))}
                                                        className="ml-0.5 text-secondary-foreground/60 hover:text-secondary-foreground"
                                                    >×</button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                <InputError message={errors.sdgs as string} />
                            </div>
                        </FormSection>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                <span className="text-accent">*</span> Required fields
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                               active:scale-95 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                                >
                                    {processing ? 'Creating…' : 'Create User'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}