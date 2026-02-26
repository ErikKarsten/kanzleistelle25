import { z } from "zod";

// Valid role and experience options
const validRoles = ["steuerfachangestellte", "steuerberater", "bilanzbuchhalter", "lohnbuchhalter"] as const;
const validExperience = ["0-1", "2-3", "4-6", "7+"] as const;
const validEmploymentTypes = ["vollzeit", "teilzeit", "minijob"] as const;

// Application form
export const applicationSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname ist erforderlich").max(100, "Vorname darf max. 100 Zeichen lang sein"),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich").max(100, "Nachname darf max. 100 Zeichen lang sein"),
  email: z.string().trim().email("Ungültige E-Mail-Adresse").max(255, "E-Mail darf max. 255 Zeichen lang sein"),
  phone: z.string().trim().min(1, "Telefonnummer ist erforderlich").max(30, "Telefonnummer darf max. 30 Zeichen lang sein").regex(/^[+\d\s\-()\/]+$/, "Bitte eine gültige Telefonnummer eingeben"),
  role: z.enum(validRoles, { errorMap: () => ({ message: "Bitte wählen Sie eine gültige Rolle" }) }),
  experience: z.enum(validExperience, { errorMap: () => ({ message: "Bitte wählen Sie eine gültige Erfahrungsstufe" }) }),
});

// Job creation/update
export const jobSchema = z.object({
  title: z.string().trim().min(2, "Jobtitel muss mindestens 2 Zeichen haben").max(200, "Jobtitel darf max. 200 Zeichen lang sein"),
  company: z.string().trim().min(1, "Firma ist erforderlich").max(200, "Firma darf max. 200 Zeichen lang sein").optional(),
  location: z.string().trim().max(200, "Standort darf max. 200 Zeichen lang sein").optional().or(z.literal("")),
  description: z.string().trim().max(5000, "Beschreibung darf max. 5000 Zeichen lang sein").optional().or(z.literal("")),
  requirements: z.string().trim().max(5000, "Anforderungen darf max. 5000 Zeichen lang sein").optional().or(z.literal("")),
  employment_type: z.enum(validEmploymentTypes, { errorMap: () => ({ message: "Ungültige Beschäftigungsart" }) }).optional().or(z.literal("")),
  salary_min: z.string().optional().or(z.literal("")),
  salary_max: z.string().optional().or(z.literal("")),
}).refine(
  (data) => {
    const min = data.salary_min ? parseInt(data.salary_min) : null;
    const max = data.salary_max ? parseInt(data.salary_max) : null;
    if (min !== null && (isNaN(min) || min < 0)) return false;
    if (max !== null && (isNaN(max) || max < 0)) return false;
    if (min !== null && max !== null && max < min) return false;
    return true;
  },
  { message: "Ungültige Gehaltsangaben (Min muss kleiner als Max sein, keine negativen Werte)" }
);

// Company creation/update
export const companySchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich").max(200, "Name darf max. 200 Zeichen lang sein"),
  location: z.string().trim().max(200, "Standort darf max. 200 Zeichen lang sein").optional().or(z.literal("")),
  description: z.string().trim().max(2000, "Beschreibung darf max. 2000 Zeichen lang sein").optional().or(z.literal("")),
  logo_url: z.string().trim().url("Ungültige URL").max(500).optional().or(z.literal("")),
  website: z.string().trim().url("Ungültige URL").max(500).optional().or(z.literal("")),
});

// Employer job creation (used by EmployerJobModal)
export const employerJobSchema = z.object({
  title: z.string().trim().min(2, "Jobtitel muss mindestens 2 Zeichen haben").max(200, "Jobtitel darf max. 200 Zeichen lang sein"),
  location: z.string().trim().max(200, "Standort darf max. 200 Zeichen lang sein").optional().or(z.literal("")),
  employment_type: z.string().max(50).optional().or(z.literal("")),
  working_model: z.string().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(5000, "Beschreibung darf max. 5000 Zeichen lang sein").optional().or(z.literal("")),
  salary_range: z.string().trim().max(100, "Gehaltsrahmen darf max. 100 Zeichen lang sein").optional().or(z.literal("")),
  contact_person_id: z.string().optional().or(z.literal("")),
});

// Password change
export const passwordChangeSchema = z.object({
  newPassword: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein").max(128),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});
