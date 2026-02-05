 import { useState } from "react";
 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { toast } from "@/hooks/use-toast";
 import { Loader2, Send } from "lucide-react";
 
 interface ApplyModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   jobId: string;
   jobTitle: string;
   company: string;
 }
 
 const ApplyModal = ({
   open,
   onOpenChange,
   jobId,
   jobTitle,
   company,
 }: ApplyModalProps) => {
   const queryClient = useQueryClient();
   const [formData, setFormData] = useState({
     firstName: "",
     lastName: "",
     email: "",
     phone: "",
   });
 
   const mutation = useMutation({
     mutationFn: async () => {
       const { error } = await supabase.from("applications").insert({
         job_id: jobId,
         first_name: formData.firstName.trim(),
         last_name: formData.lastName.trim(),
         email: formData.email.trim(),
         phone: formData.phone.trim() || null,
         applicant_id: null,
       });
       if (error) throw error;
     },
     onSuccess: () => {
       toast({
         title: "Bewerbung gesendet!",
         description: `Ihre Bewerbung bei ${company} wurde erfolgreich übermittelt.`,
       });
       queryClient.invalidateQueries({ queryKey: ["applications"] });
       setFormData({ firstName: "", lastName: "", email: "", phone: "" });
       onOpenChange(false);
     },
     onError: (error) => {
       console.error("Application error:", error);
       toast({
         title: "Fehler",
         description: "Bewerbung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
         variant: "destructive",
       });
     },
   });
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
       toast({
         title: "Fehlende Angaben",
         description: "Bitte füllen Sie alle Pflichtfelder aus.",
         variant: "destructive",
       });
       return;
     }
     mutation.mutate();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-xl">Express-Bewerbung</DialogTitle>
           <DialogDescription className="text-muted-foreground">
             Bewerben Sie sich jetzt bei <span className="font-medium text-foreground">{company}</span> als{" "}
             <span className="font-medium text-foreground">{jobTitle}</span>
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4 mt-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="firstName">Vorname *</Label>
               <Input
                 id="firstName"
                 placeholder="Max"
                 value={formData.firstName}
                 onChange={(e) =>
                   setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="lastName">Nachname *</Label>
               <Input
                 id="lastName"
                 placeholder="Mustermann"
                 value={formData.lastName}
                 onChange={(e) =>
                   setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                 }
                 required
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="email">E-Mail *</Label>
             <Input
               id="email"
               type="email"
               placeholder="max.mustermann@beispiel.de"
               value={formData.email}
               onChange={(e) =>
                 setFormData((prev) => ({ ...prev, email: e.target.value }))
               }
               required
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="phone">Telefon (optional)</Label>
             <Input
               id="phone"
               type="tel"
               placeholder="+49 123 456789"
               value={formData.phone}
               onChange={(e) =>
                 setFormData((prev) => ({ ...prev, phone: e.target.value }))
               }
             />
           </div>
 
           <Button
             type="submit"
             className="w-full"
             disabled={mutation.isPending}
           >
             {mutation.isPending ? (
               <>
                 <Loader2 className="h-4 w-4 animate-spin" />
                 Wird gesendet...
               </>
             ) : (
               <>
                 <Send className="h-4 w-4" />
                 Jetzt bewerben
               </>
             )}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default ApplyModal;