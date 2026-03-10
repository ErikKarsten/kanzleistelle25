// Shared profile completion calculation with weighted fields

export interface ProfileField {
  key: string;
  label: string;
  weight: number;
  section: "personal" | "documents" | "job-details";
}

export const PROFILE_FIELDS: ProfileField[] = [
  { key: "resume_url", label: "Lebenslauf hochgeladen", weight: 40, section: "documents" },
  { key: "special_skills", label: "Fachkenntnisse angegeben", weight: 20, section: "job-details" },
  { key: "salary_expectation", label: "Gehaltsvorstellung", weight: 15, section: "job-details" },
  { key: "earliest_start_date", label: "Eintrittsdatum", weight: 10, section: "job-details" },
  { key: "notice_period", label: "Kündigungsfrist", weight: 5, section: "job-details" },
  { key: "phone", label: "Telefonnummer", weight: 5, section: "personal" },
  { key: "cover_letter_url", label: "Anschreiben hochgeladen", weight: 5, section: "documents" },
];

export interface ProfileCompletionResult {
  percentage: number;
  items: (ProfileField & { done: boolean })[];
  missing: (ProfileField & { done: boolean })[];
  completed: (ProfileField & { done: boolean })[];
}

export function calculateProfileCompletion(application: any): ProfileCompletionResult {
  if (!application) {
    const items = PROFILE_FIELDS.map((f) => ({ ...f, done: false }));
    return { percentage: 0, items, missing: items, completed: [] };
  }

  const items = PROFILE_FIELDS.map((f) => ({
    ...f,
    done: !!application[f.key] && String(application[f.key]).trim() !== "",
  }));

  const earnedWeight = items.filter((i) => i.done).reduce((sum, i) => sum + i.weight, 0);
  const percentage = Math.min(100, earnedWeight);

  return {
    percentage,
    items,
    missing: items.filter((i) => !i.done),
    completed: items.filter((i) => i.done),
  };
}
