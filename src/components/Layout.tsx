import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Database, 
  Plus, 
  History, 
  Search,
  Settings,
  Music,
  Zap
} from "lucide-react";

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
    href: "/vendors",
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
    title: "Campaign History",
    href: "/campaigns",
    icon: History,
    hotkey: "Ctrl+4"
  },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setSearchOpen(true);
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
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Cyberpunk Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center neon-glow">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
                  Stream Strategist
                </span>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-accent/20 rounded border border-accent/30">
                <Zap className="w-3 h-3 inline mr-1" />
                Campaign Builder
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-neon"
              >
                <Search className="w-4 h-4 mr-2" />
                Search... 
                <kbd className="ml-2 text-xs bg-muted/50 px-1 rounded">Ctrl+K</kbd>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Cyberpunk Sidebar */}
        <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-sm min-h-[calc(100vh-73px)]">
          <nav className="p-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 rounded-lg transition-neon group",
                    isActive 
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-neon" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/20 hover:border hover:border-accent/30"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn(
                      "w-5 h-5 transition-neon",
                      isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )} />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <kbd className="text-xs text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded border">
                    {item.hotkey.replace('Ctrl+', '⌘')}
                  </kbd>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}