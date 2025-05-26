"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Users, 
  FileText, 
  Settings, 
  Shield, 
  PieChart, 
  Bell,
  Moon,
  FileClock,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";

// Types for our user roles and user data
type UserRole = 'GUEST' | 'USER' | 'ADMIN' | 'SADMIN'|'MANAGER';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  imageUrl?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
 
interface NavigationItems {
  USER: NavigationItem[];
  ADMIN: NavigationItem[];
  SADMIN: NavigationItem[];
  GUEST: NavigationItem[]; 
  MANAGER: NavigationItem[];
}

// Props for the Navbar component
interface NavbarProps {
  role?: string;
}

// Example navigation items based on roles
const navigationItems: NavigationItems = {

  USER: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  SADMIN: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Manage Users', href: '/search', icon: Users },
    { name: 'Logs', href: '/info/logs', icon: FileClock },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  GUEST: [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Login', href: '/login', icon: User },
  ],
  MANAGER: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]
};

export default function Navbar({ role }: NavbarProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // If role is provided directly, use it
    if (role) {
      // Create a minimal user data object with the role
      setUserData({
        id: session?.user?.id || '0',
        name: session?.user?.name || 'User',
        email: session?.user?.email || '',
        role: role.toUpperCase() as UserRole,
      });
      setIsLoading(false);
    } else {
      // Fall back to fetching user data if role wasn't provided
      const fetchUser = async () => {
        try {
          const res = await fetch('/api/user');
          if (res.ok) {
            const data = await res.json();
            setUserData({
              id: data.id,
              name: data.name,
              email: data.email,
              role: data.role.toUpperCase() as UserRole,
              imageUrl: data.image
            });
          } else {
            // If not authenticated, set as guest
            setUserData(null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUserData(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    }
  }, [role, session]);

  // Determine which navigation items to show based on user role
  const userRole = (userData?.role || 'GUEST') as UserRole;
  const navItems = navigationItems[userRole] || navigationItems.GUEST;

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <nav className="bg-background border-b border-border fixed w-full z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </span>
                <span className="ml-2 text-xl font-bold text-foreground">AppName</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems?.map((item: NavigationItem) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                // Hide Profile and Settings on md screens
                const isHiddenOnMd = (item.name === 'Profile' || item.name === 'Settings') ? 'hidden lg:inline-flex' : 'inline-flex';
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${isHiddenOnMd} items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User dropdown - only show if logged in */}
            {userData && (
              <div className="hidden sm:ml-3 sm:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.imageUrl} alt={userData.name} />
                        <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-foreground">{userData.name}</span>
                        <span className="text-xs text-muted-foreground">{userData.email}</span>
                        <span className="text-xs font-medium text-primary uppercase mt-1">
                          {userData.role}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="sm:hidden flex ml-3">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <span className="sr-only">Open menu</span>
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 sm:max-w-sm">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="px-2 pt-2 pb-3 space-y-1">
                    {/* Add theme toggle to mobile menu */}
                    <button
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                      className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="mr-3 h-5 w-5" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="mr-3 h-5 w-5" />
                          Light Mode
                        </>
                      )}
                    </button>

                    {/* Mobile user info if logged in */}
                    {userData && (
                      <div className="px-4 py-2 border-b border-border">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={userData.imageUrl} alt={userData.name} />
                            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-base font-medium text-foreground">{userData.name}</div>
                            <div className="text-sm text-muted-foreground">{userData.email}</div>
                            <div className="text-xs font-medium text-primary uppercase">
                              {userData.role}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mobile navigation links */}
                    {navItems?.map((item: NavigationItem) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={` px-3 py-2 rounded-md text-base font-medium flex items-center ${
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                          {item.name}
                        </Link>
                      );
                    })}
                    
                    {/* Logout button for mobile - only show if logged in */}
                    {userData && (
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className=" w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10 flex items-center"
                      >
                        <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                        Log out
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}