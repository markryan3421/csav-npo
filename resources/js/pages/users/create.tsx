import { Head, useForm } from '@inertiajs/react';
import { ChevronsUpDown, ImagePlus } from 'lucide-react';
import { useRef, useState } from 'react';

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
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';

interface Role {
    id: number;
    name: string;
}

interface Sdg {
    id: number;
    name: string;
}

interface CreateUserProps {
    roles: Role[];
    sdgs: Sdg[];
}

export default function CreateUser({ roles, sdgs }: CreateUserProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        avatar: null as File | null,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',           // changed from role_id
        sdgs: [] as number[], // changed from sdg_ids
    });

    const [sdgOpen, setSdgOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(UserController.store().url, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('User created successfully.');
                reset();
                setPreview(null);
            },
            onError: (error: Record<string, string>) => {
                const errorMessage = error?.message || 'Failed to create user.';
                toast.error(errorMessage);
            }
        });
    };

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

    return (
        <>
            <AppLayout>
                <Head title="Create User" />
                <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Cover Photo */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-foreground">
                                    Cover Photo
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
                                                alt="Cover preview"
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
                                    name="cover_photo"
                                    accept="image/*"
                                    tabIndex={3}
                                    className="sr-only"
                                    aria-label="Upload cover photo"
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

                            {/* Password */}
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="password">Password</Label>
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

                            {/* Password Confirmation */}
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
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
                                {processing ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </div>
            </AppLayout>
        </>
    );
}