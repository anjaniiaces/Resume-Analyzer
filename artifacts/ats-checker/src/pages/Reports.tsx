import { useState } from "react";
import { useSummaryReport, exportReport } from "@/hooks/use-reports";
import { useJobProfiles } from "@/hooks/use-job-profiles";
import { useRunBatchAnalysis } from "@/hooks/use-analysis";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [selectedRefNo, setSelectedRefNo] = useState<string>("");
  const { data: profiles } = useJobProfiles();
  const { data: report, isLoading, refetch } = useSummaryReport(selectedRefNo);
  const batchMutation = useRunBatchAnalysis();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedRefNo) return;
    try {
      await batchMutation.mutateAsync({ data: { refNo: selectedRefNo } });
      toast({ title: "Batch analysis complete", description: "Report has been updated." });
      refetch();
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
  };

  const handleExport = async () => {
    if (!selectedRefNo) return;
    try {
      const csvData = await exportReport(selectedRefNo);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ATS_Report_${selectedRefNo}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Export failed", description: "Could not generate CSV file.", variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Summary Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate and export tabulated candidate comparison sheets.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select value={selectedRefNo} onValueChange={setSelectedRefNo}>
            <SelectTrigger className="w-full sm:w-64 rounded-xl h-11 bg-card">
              <SelectValue placeholder="Select Job Profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map(p => (
                <SelectItem key={p.id} value={p.refNo}>{p.refNo} - {p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedRefNo || batchMutation.isPending}
            className="w-full sm:w-auto rounded-xl h-11 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm"
          >
            {batchMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Run Analysis
          </Button>

          <Button 
            onClick={handleExport} 
            disabled={!report || !report.candidates.length}
            className="w-full sm:w-auto rounded-xl h-11 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {!selectedRefNo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
            <FileSpreadsheet className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium text-foreground">No Profile Selected</p>
            <p className="text-sm">Select a job profile above to view the summary report.</p>
          </div>
        ) : isLoading || batchMutation.isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse">Generating comprehensive report...</p>
          </div>
        ) : !report || report.candidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
            <p className="text-lg font-medium text-foreground">No data available</p>
            <p className="text-sm mb-4">Click "Run Analysis" to process pending resumes for this profile.</p>
          </div>
        ) : (
          <>
            <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">{report.jobTitle}</h3>
                <p className="text-xs text-muted-foreground">Generated at {new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="bg-background text-sm font-semibold py-1">
                Total Candidates: {report.totalCandidates}
              </Badge>
            </div>
            
            <div className="overflow-auto flex-1">
              <Table className="whitespace-nowrap">
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-bold">Candidate Name</TableHead>
                    <TableHead className="font-bold text-center">Score</TableHead>
                    <TableHead className="font-bold">Suitability</TableHead>
                    <TableHead className="font-bold text-center">Exp (Yrs)</TableHead>
                    <TableHead className="font-bold">Match Count</TableHead>
                    <TableHead className="font-bold">Gap Count</TableHead>
                    <TableHead className="font-bold min-w-[200px]">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.candidates.sort((a,b) => b.atsScore - a.atsScore).map((candidate) => (
                    <TableRow key={candidate.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">{candidate.candidateName}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-sm ${
                          candidate.atsScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                          candidate.atsScore >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {candidate.atsScore}
                        </span>
                      </TableCell>
                      <TableCell>{candidate.suitability}</TableCell>
                      <TableCell className="text-center">{candidate.yearsExperience}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{candidate.matchingSkills?.length || 0}</TableCell>
                      <TableCell className="text-destructive font-medium">{candidate.skillsGap?.length || 0}</TableCell>
                      <TableCell className="text-sm truncate max-w-[250px]">{candidate.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
