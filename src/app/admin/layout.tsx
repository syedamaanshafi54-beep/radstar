
'use client';

import { withAdminAuth } from '@/hoc/with-admin-auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Package, Users, ShoppingCart, BarChart2, Sprout, LogOut, Store } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, FirebaseClientProvider } from '@/firebase';
import Image from 'next/image';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/vendors', label: 'Vendors', icon: Store },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/customers', label: 'Customers', icon: Users },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border/20">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span>Rad Star Admin</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    icon={<item.icon />}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-9 w-9">
              {user?.photoURL && <AvatarImage src={user.photoURL} />}
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {user?.displayName || user?.email}
              </span>
              <span className="text-xs text-sidebar-muted-foreground">Administrator</span>
            </div>
          </div>
          <Link href="/">
            <SidebarMenuButton icon={<LogOut />}>Back to Site</SidebarMenuButton>
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-[#f7f9fc]">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

const AuthenticatedAdminLayout = withAdminAuth(AdminLayoutContent);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthenticatedAdminLayout>{children}</AuthenticatedAdminLayout>
    </FirebaseClientProvider>
  )
}
