import { useState } from "react";
import { useSummaryReport } from "@/hooks/use-reports";
import { useJobProfiles } from "@/hooks/use-job-profiles";
import { useRunBatchAnalysis } from "@/hooks/use-analysis";
import { motion } from "framer-motion";
import {
  FileSpreadsheet, Download, RefreshCw, Loader2, CheckCircle2, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function scoreColor(score: number) {
  if (score >= 70) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-destructive/10 text-destructive";
}

function suitabilityColor(s: string) {
  if (s === "Highly Suitable") return "bg-emerald-100 text-emerald-800 border-transparent";
  if (s === "Suitable") return "bg-blue-100 text-blue-800 border-transparent";
  if (s === "Partially Suitable") return "bg-amber-100 text-amber-800 border-transparent";
  return "bg-red-100 text-red-800 border-transparent";
}

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
      toast({ title: "Analysis complete", description: "Report has been refreshed with latest results." });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (!selectedRefNo) return;
    const url = `/api/reports/${selectedRefNo}/export`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `ATS_Report_${selectedRefNo}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Download started", description: `ATS_Report_${selectedRefNo}.csv` });
  };

  const handleExportCurrentView = () => {
    if (!report?.candidates.length) return;

    const headers = [
      "Rank", "Candidate Name", "Email", "Phone", "Address",
      "ATS Score", "Suitability", "Years Experience",
      "Matching Skills", "Skills Gap", "Experience Summary",
      "Profile Summary", "Recommendation", "Analyzed At"
    ];

    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    const sorted = [...report.candidates].sort((a, b) => b.atsScore - a.atsScore);
    const rows = sorted.map((c, i) => [
      i + 1,
      escape(c.candidateName),
      escape(c.candidateEmail || ""),
      escape(c.candidatePhone || ""),
      escape(c.candidateAddress || ""),
      c.atsScore.toFixed(1),
      escape(c.suitability),
      c.yearsExperience.toFixed(1),
      escape((c.matchingSkills || []).join("; ")),
      escape((c.skillsGap || []).join("; ")),
      escape(c.experienceSummary || ""),
      escape(c.profileSummary || ""),
      escape(c.recommendation || ""),
      escape(c.analyzedAt ? format(new Date(c.analyzedAt), "yyyy-MM-dd HH:mm") : ""),
    ].join(","));

    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ATS_Report_${selectedRefNo}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded", description: `${sorted.length} candidates exported.` });
  };

  const sorted = report?.candidates ? [...report.candidates].sort((a, b) => b.atsScore - a.atsScore) : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            Summary Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate and download tabulated candidate comparison sheets per reference number.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select value={selectedRefNo} onValueChange={setSelectedRefNo}>
            <SelectTrigger className="w-full sm:w-64 rounded-xl h-11 bg-card">
              <SelectValue placeholder="Select Job Reference" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map(p => (
                <SelectItem key={p.id} value={p.refNo}>{p.refNo} — {p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerate}
            disabled={!selectedRefNo || batchMutation.isPending}
            variant="outline"
            className="w-full sm:w-auto rounded-xl h-11 border border-border shadow-sm"
          >
            {batchMutation.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <RefreshCw className="w-4 h-4 mr-2" />}
            Analyse All
          </Button>

          <Button
            onClick={handleExportCurrentView}
            disabled={!sorted.length}
            className="w-full sm:w-auto rounded-xl h-11 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Summary stat cards when report loaded */}
      {report && sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
          {[
            { label: "Total Candidates", value: report.totalCandidates, icon: Users, color: "text-primary" },
            { label: "Highly Suitable", value: sorted.filter(c => c.suitability === "Highly Suitable").length, icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Avg ATS Score", value: (sorted.reduce((s, c) => s + c.atsScore, 0) / sorted.length).toFixed(1), icon: FileSpreadsheet, color: "text-blue-600" },
            { label: "Avg Experience", value: `${(sorted.reduce((s, c) => s + c.yearsExperience, 0) / sorted.length).toFixed(1)} yrs`, icon: FileSpreadsheet, color: "text-amber-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {!selectedRefNo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
            <FileSpreadsheet className="w-16 h-16 opacity-20 mb-4" />
            <p className="text-lg font-medium text-foreground">Select a Job Reference</p>
            <p className="text-sm">Choose a reference number above to view the summary report sheet.</p>
          </div>
        ) : isLoading || batchMutation.isPending ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground animate-pulse">
              {batchMutation.isPending ? "Running AI analysis on resumes..." : "Loading report..."}
            </p>
          </div>
        ) : !sorted.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
            <p className="text-lg font-medium text-foreground">No results yet</p>
            <p className="text-sm mb-4">Upload resumes and click "Analyse All" to generate a report for this reference.</p>
            <Button onClick={handleGenerate} disabled={batchMutation.isPending} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" /> Analyse All Resumes
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-muted/30 px-6 py-4 border-b border-border/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-display font-bold text-foreground text-lg">{report?.jobTitle}</h3>
                <p className="text-xs text-muted-foreground">
                  Ref: {selectedRefNo} · Generated {format(new Date(report!.generatedAt), "dd MMM yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-background text-sm font-semibold py-1">
                  {report?.totalCandidates} Candidate{report?.totalCandidates !== 1 ? "s" : ""}
                </Badge>
                <Button size="sm" variant="outline" onClick={handleExportCurrentView} className="rounded-lg h-8 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <Table className="whitespace-nowrap">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-bold w-8">#</TableHead>
                    <TableHead className="font-bold">Candidate</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold text-center">Score</TableHead>
                    <TableHead className="font-bold">Suitability</TableHead>
                    <TableHead className="font-bold text-center">Exp (yrs)</TableHead>
                    <TableHead className="font-bold text-center">Matched</TableHead>
                    <TableHead className="font-bold text-center">Gap</TableHead>
                    <TableHead className="font-bold min-w-[220px]">Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((c, i) => (
                    <TableRow key={c.id} className="hover:bg-muted/30 align-top">
                      <TableCell className="text-muted-foreground font-medium">{i + 1}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{c.candidateName}</p>
                        {c.candidateAddress && (
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.candidateAddress}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.candidateEmail && <p className="text-xs text-foreground">{c.candidateEmail}</p>}
                        {c.candidatePhone && <p className="text-xs text-muted-foreground">{c.candidatePhone}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-sm ${scoreColor(c.atsScore)}`}>
                          {c.atsScore.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${suitabilityColor(c.suitability)} shadow-none`}>
                          {c.suitability}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{c.yearsExperience}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-semibold">{c.matchingSkills?.length ?? 0}</TableCell>
                      <TableCell className="text-center text-destructive font-semibold">{c.skillsGap?.length ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px] whitespace-normal leading-relaxed">
                        {c.recommendation}
                      </TableCell>
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
