import { useState } from "react";
import { useJobProfiles, useCreateProfile, useUpdateProfile, useDeleteProfile } from "@/hooks/use-job-profiles";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  refNo: z.string().min(2, "Reference number is required"),
  title: z.string().min(2, "Title is required"),
  department: z.string().optional(),
  description: z.string().min(10, "Description should be longer"),
  requiredSkills: z.string().min(2, "At least one skill required"),
  preferredSkills: z.string().optional(),
  minExperienceYears: z.coerce.number().min(0, "Must be 0 or more"),
});

type FormValues = z.infer<typeof formSchema>;

export default function JobProfiles() {
  const { data: profiles, isLoading } = useJobProfiles();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRefNo, setEditingRefNo] = useState<string | null>(null);
  
  const [deleteRefNo, setDeleteRefNo] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      refNo: "",
      title: "",
      department: "",
      description: "",
      requiredSkills: "",
      preferredSkills: "",
      minExperienceYears: 0,
    }
  });

  const openCreate = () => {
    setEditingRefNo(null);
    form.reset({
      refNo: "", title: "", department: "", description: "", requiredSkills: "", preferredSkills: "", minExperienceYears: 0
    });
    setIsFormOpen(true);
  };

  const openEdit = (profile: any) => {
    setEditingRefNo(profile.refNo);
    form.reset({
      refNo: profile.refNo,
      title: profile.title,
      department: profile.department || "",
      description: profile.description,
      requiredSkills: profile.requiredSkills.join(", "),
      preferredSkills: profile.preferredSkills?.join(", ") || "",
      minExperienceYears: profile.minExperienceYears,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      refNo: values.refNo,
      title: values.title,
      department: values.department,
      description: values.description,
      requiredSkills: values.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
      preferredSkills: values.preferredSkills ? values.preferredSkills.split(",").map(s => s.trim()).filter(Boolean) : [],
      minExperienceYears: values.minExperienceYears,
    };

    try {
      if (editingRefNo) {
        await updateMutation.mutateAsync({ refNo: editingRefNo, data: payload });
        toast({ title: "Profile updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Profile created successfully" });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteRefNo) return;
    try {
      await deleteMutation.mutateAsync({ refNo: deleteRefNo });
      toast({ title: "Profile deleted successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteRefNo(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Job Profiles
          </h1>
          <p className="text-muted-foreground mt-1">Manage active job requirements for ATS matching.</p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="rounded-xl px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{editingRefNo ? "Edit Job Profile" : "Create Job Profile"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="refNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ENG-2024-01" disabled={!!editingRefNo} {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Frontend Engineer" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Engineering" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minExperienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min. Experience (Years)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Paste the full job description here..." className="min-h-[120px] rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiredSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills (Comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="React, TypeScript, Node.js..." {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Skills (Comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="GraphQL, Docker, AWS..." {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-xl px-8">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Ref No</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Required Skills</TableHead>
              <TableHead className="font-semibold">Min Exp</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading profiles...</TableCell></TableRow>
            ) : !profiles || profiles.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No job profiles found. Create one to get started.</TableCell></TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground">{profile.refNo}</TableCell>
                  <TableCell>{profile.title}</TableCell>
                  <TableCell>{profile.department || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {profile.requiredSkills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                      ))}
                      {profile.requiredSkills.length > 3 && (
                        <Badge variant="outline" className="text-muted-foreground">+{profile.requiredSkills.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{profile.minExperienceYears} yrs</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(profile)} className="hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteRefNo(profile.refNo)} className="hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteRefNo} onOpenChange={() => setDeleteRefNo(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete profile <strong>{deleteRefNo}</strong>? This action cannot be undone and may affect associated resumes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
}
