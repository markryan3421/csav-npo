import { Link, usePage } from '@inertiajs/react';
import { Airplay, CircleMinus, CircleUser, Flag, Landmark, Lock, UserCog, Clipboard, Banknote, History, Shield, Logs } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { FileBadge, Calendar, UserRoundCog, Contact, BookUser } from 'lucide-react';
import { Users } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url'; // Add this import
import GoalController from '@/actions/App/Http/Controllers/GoalController';

const ExpendituresItems: NavItem[] = [
    {
        title: 'Your SDGs',
        href: '/dashboard',
        icon: Airplay,
    },
    {
        title: 'Dashboard',
        href: GoalController.index().url,
        icon: Landmark,
        // permission: 'access goal',
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: Lock,
        permission: 'access permission',
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
        permission: 'access role',
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
        permission: 'access user',
    },
    {
        title: 'Logs',
        href: '/logs',
        icon: Logs,
        // permission: 'access user',
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { state } = useSidebar();
    const { isCurrentUrl } = useCurrentUrl(); // Add this hook
    const isExpanded = state === 'expanded';

    // TODO: Refactor to use a custom hook for auth and permissions
    const { auth } = usePage().props as any;
    const roles = auth.roles;
    const permissions = auth.permissions;

    const filterNavItems = ExpendituresItems.filter((item) => !item.permission || permissions.includes(item.permission));

    return (
        <Sidebar collapsible="icon" className="border-r-1 bg-white border-gray-400">
            <SidebarHeader className={`${isExpanded ? 'ms-3' : 'border-b border-border/50' }`}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="py-10"
                            asChild
                        >
                            <Link href={dashboard()} prefetch className="h-8 w-8 hover:bg-white">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={`
                ${isExpanded ? 'px-5' : 'me-1 transition-all duration-200 ease-in-out'}`}
            >
                <NavMain items={filterNavItems} label="Goals" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}