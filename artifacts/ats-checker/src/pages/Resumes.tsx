import { useState, useRef, useCallback } from "react";
import { useResumes, useUploadNewResume, useRemoveResume } from "@/hooks/use-resumes";
import { useJobProfiles } from "@/hooks/use-job-profiles";
import { useAnalyzeSingleResume } from "@/hooks/use-analysis";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, UploadCloud, Trash2, BrainCircuit, Search,
  Loader2, Folder, Files, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UploadQueueItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function Resumes() {
  const [selectedRefNo, setSelectedRefNo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { data: resumes, isLoading } = useResumes(selectedRefNo === "ALL" ? undefined : selectedRefNo || undefined);
  const { data: profiles } = useJobProfiles();

  const uploadMutation = useUploadNewResume();
  const deleteMutation = useRemoveResume();
  const analyzeMutation = useAnalyzeSingleResume();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [uploadRefNo, setUploadRefNo] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const ACCEPTED = [".pdf", ".doc", ".docx", ".txt"];

  const addFilesToQueue = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f =>
      ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (!arr.length) {
      toast({ title: "No valid files", description: "Please select PDF, DOCX or TXT files.", variant: "destructive" });
      return;
    }
    setQueue(prev => [...prev, ...arr.map(f => ({ file: f, status: "pending" as const }))]);
  };

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
    if (e.dataTransfer.files?.length) addFilesToQueue(e.dataTransfer.files);
  };

  const removeFromQueue = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const clearQueue = () => setQueue([]);

  const doUploadAll = useCallback(async () => {
    if (!uploadRefNo || !queue.length) return;
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "done") continue;
      setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "uploading" } : item));
      try {
        await uploadMutation.mutateAsync({
          data: { file: queue[i].file, refNo: uploadRefNo, fileName: queue[i].file.name }
        });
        setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "done" } : item));
        successCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "error", error: msg } : item));
        failCount++;
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast({ title: `Uploaded ${successCount} resume${successCount > 1 ? "s" : ""}`, description: failCount ? `${failCount} failed.` : undefined });
    }
    if (failCount > 0 && successCount === 0) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  }, [uploadRefNo, queue, uploadMutation, toast]);

  const doAnalyze = async (id: number) => {
    try {
      await analyzeMutation.mutateAsync({ resumeId: id });
      toast({ title: "Analysis complete", description: "Candidate matched against job profile successfully." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast({ title: "Analysis failed", description: msg, variant: "destructive" });
    }
  };

  const doDelete = async (id: number) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Deleted successfully" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const filteredResumes = resumes?.filter(r =>
    !searchTerm ||
    r.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.candidateName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = queue.filter(q => q.status === "pending").length;
  const doneCount = queue.filter(q => q.status === "done").length;
  const errorCount = queue.filter(q => q.status === "error").length;
  const uploadProgress = queue.length > 0 ? Math.round((doneCount / queue.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Resume Management
        </h1>
        <p className="text-muted-foreground mt-1">Upload resumes individually, in bulk, or from a folder. Run AI-powered ATS analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-4">Upload Resumes</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Job Profile</label>
                <Select value={uploadRefNo} onValueChange={setUploadRefNo}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select reference number" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map(p => (
                      <SelectItem key={p.id} value={p.refNo}>{p.refNo} — {p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/20"}`}
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
                  multiple
                  onChange={(e) => e.target.files && addFilesToQueue(e.target.files)}
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Drag & drop or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT · Multiple files supported</p>
              </div>

              {/* Folder / multi-file buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 text-xs font-medium"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute("webkitdirectory");
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Files className="w-3.5 h-3.5 mr-1.5" />
                  Select Files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 text-xs font-medium"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <Folder className="w-3.5 h-3.5 mr-1.5" />
                  From Folder
                </Button>
                {/* Hidden folder input */}
                <input
                  type="file"
                  ref={folderInputRef}
                  className="hidden"
                  // @ts-expect-error webkitdirectory is non-standard but widely supported
                  webkitdirectory="true"
                  multiple
                  onChange={(e) => e.target.files && addFilesToQueue(e.target.files)}
                />
              </div>

              {/* Queue list */}
              <AnimatePresence>
                {queue.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{queue.length} file{queue.length > 1 ? "s" : ""} queued</span>
                      <button onClick={clearQueue} className="hover:text-destructive transition-colors">Clear all</button>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress} className="h-2 rounded-full" />
                        <p className="text-xs text-muted-foreground text-center">{doneCount}/{queue.length} uploaded</p>
                      </div>
                    )}

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                      {queue.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg px-3 py-1.5">
                          {item.status === "pending" && <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          {item.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                          {item.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          {item.status === "error" && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                          <span className="flex-1 truncate font-medium text-foreground">{item.file.name}</span>
                          {item.status === "pending" && (
                            <button onClick={() => removeFromQueue(idx)} className="text-muted-foreground hover:text-destructive">✕</button>
                          )}
                        </div>
                      ))}
                    </div>

                    {errorCount > 0 && (
                      <p className="text-xs text-destructive">{errorCount} file{errorCount > 1 ? "s" : ""} failed to upload.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={doUploadAll}
                disabled={!queue.length || !uploadRefNo || isUploading || pendingCount === 0}
                className="w-full rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {isUploading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading {doneCount + 1}/{queue.length}...</>
                  : <><UploadCloud className="w-4 h-4 mr-2" />Upload {queue.filter(q => q.status === "pending").length || ""} Resume{queue.filter(q => q.status === "pending").length !== 1 ? "s" : ""} to ATS</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Resumes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or file..."
                  className="w-full pl-9 rounded-xl h-10 bg-card border-border/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
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
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading resumes...
                      </TableCell>
                    </TableRow>
                  ) : !filteredResumes || filteredResumes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3 mx-auto" />
                        {searchTerm ? "No resumes match your search." : "No resumes uploaded yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResumes.map(resume => (
                      <TableRow key={resume.id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell>
                          <p className="font-medium text-foreground">{resume.candidateName || "Not yet analyzed"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={resume.fileName}>{resume.fileName}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium bg-card">{resume.refNo}</Badge>
                        </TableCell>
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
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-lg h-8 px-3 font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                              onClick={() => doAnalyze(resume.id)}
                              disabled={analyzeMutation.isPending}
                            >
                              {analyzeMutation.isPending
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />}
                              {resume.analysisId ? "Re-analyze" : "Analyze"}
                            </Button>
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
