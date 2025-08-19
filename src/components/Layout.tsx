import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Database, 
  Plus, 
  History, 
  Search,
  Settings,
  Music,
  Menu,
  X,
  Key,
  LogOut,
  User,
  Users
} from "lucide-react";
import SpotifySettingsModal from "./SpotifySettingsModal";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    hotkey: "Ctrl+1"
  },
  {
    title: "Vendors & Playlists",
    href: "/playlists", 
    icon: Database,
    hotkey: "Ctrl+2"
  },
  {
    title: "Build Campaign",
    href: "/campaign/new",
    icon: Plus,
    hotkey: "Ctrl+3"
  },
  {
    title: "View Campaigns",
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
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSpotifySettings, setShowSpotifySettings] = useState(false);
  const { user, signOut } = useAuth();
  
  const getUserInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase();
  };

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            // Focus search input
            document.getElementById('global-search')?.focus();
            break;
          case '1':
            e.preventDefault();
            window.location.href = '/';
            break;
          case '2':
            e.preventDefault();
            window.location.href = '/vendors';
            break;
          case '3':
            e.preventDefault();
            window.location.href = '/campaign/new';
            break;
          case '4':
            e.preventDefault();
            window.location.href = '/campaigns';
            break;
          case '5':
            e.preventDefault();
            window.location.href = '/clients';
            break;
        }
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
                <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  ARTIST <span className="text-primary">INFLUENCE</span>
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth",
                        isActive 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Search & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="global-search"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-16 bg-input border-border"
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Ctrl+K
                </kbd>
              </div>

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
                      <span>Build Campaign</span>
                      <kbd className="text-xs bg-muted px-1 rounded">Ctrl+3</kbd>
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

              {/* User Profile */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.email || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm">{user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.email?.split('@')[0]}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
                {navItems.map((item) => {
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
        {children}
      </main>
      
      <SpotifySettingsModal 
        open={showSpotifySettings} 
        onOpenChange={setShowSpotifySettings}
      />
    </div>
  );
}