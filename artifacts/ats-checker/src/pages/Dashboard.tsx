import { useJobProfiles } from "@/hooks/use-job-profiles";
import { useResumes } from "@/hooks/use-resumes";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays } from "date-fns";

export default function Dashboard() {
  const { data: profiles } = useJobProfiles();
  const { data: resumes } = useResumes();

  const totalProfiles = profiles?.length || 0;
  const totalResumes = resumes?.length || 0;
  const analyzedResumes = resumes?.filter(r => r.analysisId).length || 0;
  const pendingResumes = totalResumes - analyzedResumes;

  // Mock chart data based on last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      name: format(date, "MMM dd"),
      resumes: Math.floor(Math.random() * 15) + 5,
      analyzed: Math.floor(Math.random() * 10) + 2
    };
  });

  const stats = [
    { title: "Active Job Profiles", value: totalProfiles, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-600/10" },
    { title: "Total Candidates", value: totalResumes, icon: Users, color: "text-purple-600", bg: "bg-purple-600/10" },
    { title: "Analyzed Resumes", value: analyzedResumes, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-600/10" },
    { title: "Pending Analysis", value: pendingResumes, icon: Clock, color: "text-amber-600", bg: "bg-amber-600/10" },
  ];

  const recentResumes = resumes?.slice(0, 5) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your ATS intelligence platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-display font-bold text-foreground">{stat.value}</h3>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Processing Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="resumes" name="Uploaded" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="analyzed" name="Analyzed" fill="hsl(156, 73%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentResumes.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No resumes uploaded yet.
                </div>
              ) : (
                recentResumes.map((resume) => (
                  <div key={resume.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-foreground truncate">{resume.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Ref: {resume.refNo}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${resume.analysisId ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {resume.analysisId ? 'Done' : 'Pending'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
