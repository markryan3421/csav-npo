import { Head, useForm } from '@inertiajs/react';
import { ChevronsUpDown, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import UserController from '@/actions/App/Http/Controllers/UserController';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface Role {
    id: number;
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
    roles: Role[];
    sdgs: Sdg[];
}

interface EditUserProps {
    user: User;
    roles: Role[];
    sdgs: Sdg[];
}

export default function EditUser({ user, roles, sdgs }: EditUserProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        avatar: null as File | null,
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.roles[0]?.name || '', // assume one role per user
        sdgs: user.sdgs.map(sdg => sdg.id),
    });

    const [sdgOpen, setSdgOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(
        user.avatar ? `/storage/${user.avatar}` : null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // If password fields are empty, remove them from request
        if (!data.password) {
            delete data.password;
            delete data.password_confirmation;
        }

        put(UserController.update(user.id).url, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('User updated successfully.');
                // Optionally redirect to show page or index
            },
            onError: (error: Record<string, string>) => {
                const errorMessage = error?.message || 'Failed to update user.';
                toast.error(errorMessage);
            }
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
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
                                <Link
                                    href="/settings/users"
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

                                <h2 className="font-semibold text-2xl text-black leading-tight">
                                    Edit User
                                </h2>

                                {/* Save button in header (optional) */}
                                <Button
                                    type="submit"
                                    form="edit-user-form"
                                    disabled={processing}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    {processing ? 'Saving...' : 'Update User'}
                                </Button>
                            </div>

                            {/* Edit Form */}
                            <div className="bg-gray-50 rounded-lg p-8 shadow mb-10">
                                <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* Avatar Upload */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-foreground">
                                                Avatar
                                                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                                            </Label>
                                            <div
                                                className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200"
                                                style={{ borderColor: preview ? "#004f39" : undefined }}
                                                onClick={() => fileInputRef.current?.click()}
                                                onMouseEnter={(e) => {
                                                    if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "#004f39";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!preview) (e.currentTarget as HTMLElement).style.borderColor = "";
                                                }}
                                            >
                                                {preview ? (
                                                    <div className="relative">
                                                        <img
                                                            src={preview}
                                                            alt="Avatar preview"
                                                            className="h-48 w-full object-cover"
                                                        />
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100"
                                                            style={{ backgroundColor: "rgba(0,79,57,0.75)" }}
                                                        >
                                                            <p className="text-sm font-semibold" style={{ color: "#fdfa00" }}>
                                                                Click to change image
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                                        <div
                                                            className="flex h-12 w-12 items-center justify-center rounded-full"
                                                            style={{ backgroundColor: "rgba(0,79,57,0.08)" }}
                                                        >
                                                            <ImagePlus className="h-6 w-6" style={{ color: "#004f39" }} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">Click to upload</p>
                                                            <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                type="file"
                                                name="avatar"
                                                accept="image/*"
                                                className="sr-only"
                                                aria-label="Upload avatar"
                                            />
                                            {data.avatar && (
                                                <p className="text-xs text-muted-foreground">
                                                    Selected: <span className="font-medium text-foreground">{data.avatar.name}</span>
                                                </p>
                                            )}
                                            <InputError message={errors.avatar} />
                                        </div>

                                        {/* Name */}
                                        <div className="col-span-2 md:col-span-1">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                disabled={processing}
                                                className="mt-1"
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div className="col-span-2 md:col-span-1">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                disabled={processing}
                                                className="mt-1"
                                            />
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                        </div>

                                        {/* New Password (optional) */}
                                        <div className="col-span-2 md:col-span-1">
                                            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                disabled={processing}
                                                className="mt-1"
                                            />
                                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="col-span-2 md:col-span-1">
                                            <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                disabled={processing}
                                                className="mt-1"
                                            />
                                            {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                                        </div>

                                        {/* Role (single select) */}
                                        <div className="col-span-2 md:col-span-1">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={data.role}
                                                onValueChange={(value) => setData('role', value)}
                                                disabled={processing}
                                            >
                                                <SelectTrigger id="role" className="mt-1">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.name}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                                        </div>

                                        {/* SDGs (multi-select) */}
                                        <div className="col-span-2">
                                            <Label htmlFor="sdgs">SDGs</Label>
                                            <Popover open={sdgOpen} onOpenChange={setSdgOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={sdgOpen}
                                                        className="mt-1 w-full justify-between"
                                                        disabled={processing}
                                                    >
                                                        {data.sdgs.length === 0
                                                            ? "Select SDGs"
                                                            : `${data.sdgs.length} selected`}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search SDGs..." />
                                                        <CommandList>
                                                            <CommandEmpty>No SDGs found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {sdgs.map((sdg) => {
                                                                    const isSelected = data.sdgs.includes(sdg.id);
                                                                    return (
                                                                        <CommandItem
                                                                            key={sdg.id}
                                                                            value={sdg.name}
                                                                            onSelect={() => {
                                                                                const newSelected = isSelected
                                                                                    ? data.sdgs.filter((id) => id !== sdg.id)
                                                                                    : [...data.sdgs, sdg.id];
                                                                                setData('sdgs', newSelected);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Checkbox
                                                                                    checked={isSelected}
                                                                                    className="pointer-events-none"
                                                                                />
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
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Select one or more SDGs that this user will be assigned to.
                                            </p>
                                            {errors.sdgs && <p className="mt-1 text-sm text-red-600">{errors.sdgs}</p>}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Updating...' : 'Update User'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}