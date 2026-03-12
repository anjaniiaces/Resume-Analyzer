import { useState, useRef } from "react";
import { useResumes, useUploadNewResume, useRemoveResume } from "@/hooks/use-resumes";
import { useJobProfiles } from "@/hooks/use-job-profiles";
import { useAnalyzeSingleResume } from "@/hooks/use-analysis";
import { motion } from "framer-motion";
import { FileText, UploadCloud, Trash2, BrainCircuit, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Resumes() {
  const [selectedRefNo, setSelectedRefNo] = useState<string>("");
  const { data: resumes, isLoading } = useResumes(selectedRefNo === "ALL" ? undefined : selectedRefNo || undefined);
  const { data: profiles } = useJobProfiles();
  
  const uploadMutation = useUploadNewResume();
  const deleteMutation = useRemoveResume();
  const analyzeMutation = useAnalyzeSingleResume();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadRefNo, setUploadRefNo] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const doUpload = async () => {
    if (!file || !uploadRefNo) return;
    try {
      await uploadMutation.mutateAsync({ data: { file, refNo: uploadRefNo, fileName: file.name } });
      toast({ title: "Resume uploaded successfully" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const doAnalyze = async (id: number) => {
    try {
      await analyzeMutation.mutateAsync({ resumeId: id });
      toast({ title: "Analysis complete", description: "Candidate matched against ATS successfully." });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    }
  };

  const doDelete = async (id: number) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted successfully" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Resume Management
        </h1>
        <p className="text-muted-foreground mt-1">Upload resumes and run AI-powered ATS analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm shadow-black/5">
            <h3 className="font-display font-semibold text-lg mb-4">Upload New Resume</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Job Profile</label>
                <Select value={uploadRefNo} onValueChange={setUploadRefNo}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select reference number" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map(p => (
                      <SelectItem key={p.id} value={p.refNo}>{p.refNo} - {p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click or drag resume here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT up to 10MB</p>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); doUpload(); }} 
                disabled={!file || !uploadRefNo || uploadMutation.isPending}
                className="w-full rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload to ATS"}
              </Button>
            </div>
          </div>
        </div>

        {/* Resumes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search filenames..." className="w-full pl-9 rounded-xl h-10 bg-card border-border/50" />
              </div>
              <Select value={selectedRefNo} onValueChange={setSelectedRefNo}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl h-10 bg-card border-border/50">
                  <SelectValue placeholder="Filter by Job Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Profiles</SelectItem>
                  {profiles?.map(p => (
                    <SelectItem key={p.id} value={p.refNo}>{p.refNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Candidate</TableHead>
                    <TableHead>Target Job</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading resumes...</TableCell></TableRow>
                  ) : !resumes || resumes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground flex-col flex items-center justify-center">
                      <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                      No resumes found.
                    </TableCell></TableRow>
                  ) : (
                    resumes.map(resume => (
                      <TableRow key={resume.id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell>
                          <p className="font-medium text-foreground">{resume.candidateName || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={resume.fileName}>{resume.fileName}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="font-medium bg-card">{resume.refNo}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(resume.uploadedAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {resume.analysisId ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent shadow-none">Analyzed</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent shadow-none">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!resume.analysisId && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="rounded-lg h-8 px-3 font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                onClick={() => doAnalyze(resume.id)}
                                disabled={analyzeMutation.isPending}
                              >
                                {analyzeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />}
                                Analyze
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => doDelete(resume.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
