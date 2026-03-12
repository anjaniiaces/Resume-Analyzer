import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  BarChart2, 
  FileSpreadsheet,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/profiles", label: "Job Profiles", icon: Briefcase },
  { path: "/resumes", label: "Resumes", icon: FileText },
  { path: "/analysis", label: "Analysis Results", icon: BarChart2 },
  { path: "/reports", label: "Reports", icon: FileSpreadsheet },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
      <div className="h-20 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="ATS Logo" 
            className="w-10 h-10 rounded-xl shadow-sm bg-white p-1"
          />
          <div>
            <h1 className="font-display font-bold text-lg text-sidebar-foreground leading-tight">MatchPoint</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider font-semibold">ATS Intelligence</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4 px-2">
          Overview
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-sidebar-primary/10 text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sidebar-primary rounded-xl z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 z-10", isActive ? "text-white" : "group-hover:text-sidebar-foreground")} />
                <span className={cn("font-medium z-10", isActive && "text-white")}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border/50 mt-auto">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
