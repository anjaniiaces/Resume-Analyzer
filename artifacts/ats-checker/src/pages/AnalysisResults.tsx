import { useState } from "react";
import { useSummaryReport } from "@/hooks/use-reports";
import { useJobProfiles } from "@/hooks/use-job-profiles";
import { motion } from "framer-motion";
import { BarChart2, CheckCircle, XCircle, Search, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AnalysisResults() {
  const { data: profiles } = useJobProfiles();
  const [selectedRefNo, setSelectedRefNo] = useState<string>("");
  
  const { data: report, isLoading } = useSummaryReport(selectedRefNo);
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const candidates = report?.candidates?.filter(c => 
    c.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    c.profileSummary?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500 stroke-emerald-500";
    if (score >= 50) return "text-amber-500 stroke-amber-500";
    return "text-destructive stroke-destructive";
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-50";
    if (score >= 50) return "bg-amber-50";
    return "bg-destructive/10";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-primary" />
            Analysis Results
          </h1>
          <p className="text-muted-foreground mt-1">Deep dive into candidate ATS matching performance.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select value={selectedRefNo} onValueChange={setSelectedRefNo}>
            <SelectTrigger className="w-full md:w-64 rounded-xl h-11 bg-card border-border shadow-sm">
              <SelectValue placeholder="Select Job Profile to view" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map(p => (
                <SelectItem key={p.id} value={p.refNo}>{p.refNo} - {p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedRefNo ? (
        <div className="h-64 flex flex-col items-center justify-center bg-card rounded-3xl border border-border border-dashed">
          <Sparkles className="w-12 h-12 text-primary/30 mb-4" />
          <h3 className="text-xl font-display font-semibold text-foreground">Select a Job Profile</h3>
          <p className="text-muted-foreground mt-2 text-sm max-w-md text-center">Choose a reference number from the dropdown above to view detailed AI analysis results for candidates.</p>
        </div>
      ) : isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-md mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search candidates..." 
              className="pl-11 h-12 rounded-xl shadow-sm border-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate, i) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedCandidate(candidate)}
                className="cursor-pointer"
              >
                <Card className={`h-full border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{candidate.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.yearsExperience} yrs experience</p>
                      </div>
                      
                      <div className="relative flex items-center justify-center w-14 h-14">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                          <circle 
                            cx="28" cy="28" r="24" 
                            stroke="currentColor" 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={`${(candidate.atsScore / 100) * 150} 150`} 
                            className={getScoreColor(candidate.atsScore)} 
                          />
                        </svg>
                        <span className={`absolute text-sm font-bold ${getScoreColor(candidate.atsScore).split(' ')[0]}`}>{candidate.atsScore}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Badge variant="secondary" className={`${getScoreBg(candidate.atsScore)} ${getScoreColor(candidate.atsScore).split(' ')[0]} border-transparent`}>
                        {candidate.suitability}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                      {candidate.profileSummary}
                    </p>

                    <div className="flex gap-4 text-xs font-medium border-t border-border/50 pt-4">
                      <div className="flex items-center text-emerald-600 gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        {candidate.matchingSkills?.length || 0} Matches
                      </div>
                      <div className="flex items-center text-destructive gap-1.5">
                        <XCircle className="w-4 h-4" />
                        {candidate.skillsGap?.length || 0} Gaps
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {candidates.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No candidates found matching your criteria.
              </div>
            )}
          </div>
        </>
      )}

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0 border-0 shadow-2xl">
          {selectedCandidate && (
            <>
              <div className={`p-6 md:p-8 ${getScoreBg(selectedCandidate.atsScore)} border-b border-border/10`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-foreground mb-1">{selectedCandidate.candidateName}</h2>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                      {selectedCandidate.candidateEmail} • {selectedCandidate.candidatePhone}
                    </p>
                  </div>
                  <div className={`text-center bg-white px-4 py-3 rounded-2xl shadow-sm border border-black/5`}>
                    <div className={`text-4xl font-display font-bold ${getScoreColor(selectedCandidate.atsScore).split(' ')[0]}`}>
                      {selectedCandidate.atsScore}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">ATS Score</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 bg-card">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Profile Summary</h4>
                  <p className="text-foreground leading-relaxed text-[15px]">{selectedCandidate.profileSummary}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Matching Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.matchingSkills?.length ? selectedCandidate.matchingSkills.map((s: string) => (
                        <Badge key={s} variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">{s}</Badge>
                      )) : <span className="text-sm text-muted-foreground">None identified</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Skills Gap
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skillsGap?.length ? selectedCandidate.skillsGap.map((s: string) => (
                        <Badge key={s} variant="outline" className="bg-destructive/10 border-destructive/20 text-destructive">{s}</Badge>
                      )) : <span className="text-sm text-muted-foreground">None identified</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Experience Assessment ({selectedCandidate.yearsExperience} yrs)</h4>
                  <p className="text-foreground leading-relaxed text-[15px]">{selectedCandidate.experienceSummary}</p>
                </div>

                <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Recommendation</h4>
                  <p className="text-foreground font-medium">{selectedCandidate.recommendation}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
