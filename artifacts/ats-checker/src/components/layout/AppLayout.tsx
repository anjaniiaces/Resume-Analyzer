import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex w-full font-sans text-foreground selection:bg-primary/20 selection:text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-8 z-10 relative shadow-sm shadow-black/5">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search candidates, profiles, or reports..." 
                className="w-full pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 rounded-xl h-11"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </button>
            <div className="w-px h-8 bg-border mx-2"></div>
            <button className="flex items-center gap-3 hover:bg-muted p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm text-left hidden sm:block">
                <p className="font-semibold leading-none mb-1">Admin User</p>
                <p className="text-xs text-muted-foreground leading-none">HR Manager</p>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background/50">
          <div className="container max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
