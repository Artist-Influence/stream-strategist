import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PROJECT_NAME, PROJECT_ID } from "@/lib/constants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Database, 
  Plus, 
  History, 
  Settings,
  Music,
  Menu,
  X,
  Key,
  Users,
  LogOut,
  User,
  UserPlus,
  Brain,
  Shield,
  FileText,
  DollarSign,
  Target,
  Receipt
} from "lucide-react";
import SpotifySettingsModal from "./SpotifySettingsModal";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "./GlobalSearch";
import { Breadcrumb } from "./Breadcrumb";
import { NotificationCenter } from "./NotificationCenter";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  hotkey: string;
  adminOnly?: boolean;
}

// Role-based navigation items
const getNavItemsForRole = (currentRole: string | null) => {
  const baseItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      hotkey: "Ctrl+1"
    },
  ];

  if (currentRole === 'admin' || currentRole === 'manager') {
    return [
      ...baseItems,
      {
        title: "Vendors",
        href: "/playlists", 
        icon: Database,
        hotkey: "Ctrl+2"
      },
      {
        title: "Campaigns",
        href: "/campaigns",
        icon: History,
        hotkey: "Ctrl+4"
      },
      {
        title: "Clients",
        href: "/clients",
        icon: Users,
        hotkey: "Ctrl+5"
      },
      {
        title: "ML Analytics",
        href: "/ml-dashboard",
        icon: Brain,
        hotkey: "Ctrl+7"
      },
      {
        title: "Compliance",
        href: "/compliance",
        icon: Shield,
        hotkey: "Ctrl+8"
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
        hotkey: "Ctrl+9"
      },
      {
        title: "Payments",
        href: "/payments",
        icon: DollarSign,
        hotkey: "Ctrl+P"
      },
      {
        title: "Team Goals",
        href: "/team-goals",
        icon: Target,
        hotkey: "Ctrl+T"
      },
      ...(currentRole === 'admin' ? [{
        title: "Users", 
        href: "/users",
        icon: UserPlus,
        hotkey: "Ctrl+6",
        adminOnly: true
      }] : [])
    ];
  }

  if (currentRole === 'salesperson') {
    return [
      {
        title: "Dashboard",
        href: "/salesperson",
        icon: Home,
        hotkey: "Ctrl+1"
      },
      {
        title: "Submit Campaign",
        href: "/campaign-intake",
        icon: Plus,
        hotkey: "Ctrl+2"
      }
    ];
  }

  if (currentRole === 'vendor') {
    return [
      ...baseItems,
      {
        title: "My Playlists",
        href: "/vendor/playlists",
        icon: Music,
        hotkey: "Ctrl+2"
      },
      {
        title: "Campaign Requests",
        href: "/vendor/requests",
        icon: History,
        hotkey: "Ctrl+3"
      },
      {
        title: "Payment History",
        href: "/vendor/payments",
        icon: Receipt,
        hotkey: "Ctrl+4"
      }
    ];
  }

  return baseItems;
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentRole, signOut, hasRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSpotifySettings, setShowSpotifySettings] = useState(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Artist Influence Style Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Brand */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <img 
                  src="/src/assets/artist-influence-logo.png" 
                  alt="Artist Influence Logo" 
                  className="h-8 w-auto"
                />
              </Link>
              
              {/* Project Identifier */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-medium text-primary">SPOTIFY CAMPAIGNS</span>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-3" data-tour="navigation">
                {getNavItemsForRole(currentRole).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-smooth",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex" data-tour="search">
                <GlobalSearch onSelect={() => setMobileMenuOpen(false)} />
              </div>

              {/* Notifications */}
              <NotificationCenter />

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setShowSpotifySettings(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Spotify API Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* User Info */}
                  {user && (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="text-sm">{user.email}</span>
                          <span className="text-xs text-muted-foreground">Role: {currentRole || 'No role'}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut();
                      navigate('/auth');
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Keyboard Shortcuts</DropdownMenuLabel>
                  
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>Search</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+K</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>New Campaign</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+N</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>Export Data</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+E</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>Dashboard</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+1</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>Browse Playlists</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+2</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>View Campaigns</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+4</kbd>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <span className="flex justify-between w-full">
                      <span>Clients</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+5</kbd>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>


              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-border pt-4">
              <nav className="space-y-2">
                {getNavItemsForRole(currentRole).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-smooth",
                        isActive 
                          ? "bg-primary/10 text-primary border-l-2 border-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-73px)]">
        <div className="container mx-auto px-6 py-6">
          <Breadcrumb />
          {children}
        </div>
      </main>
      
      <SpotifySettingsModal 
        open={showSpotifySettings} 
        onOpenChange={setShowSpotifySettings}
      />
      
      <KeyboardShortcutsModal />
    </div>
  );
}