import { supabase } from "@/integrations/supabase/client";

interface DownloadTarget {
  bucket: "applications" | "resumes";
  path: string;
}

interface DownloadSuccess {
  blob: Blob;
  bucket: "applications" | "resumes";
  path: string;
}

const STORAGE_PATH_REGEX = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/i;

const cleanSegment = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");

export const normalizeStoragePath = (rawPath: string): { path: string; bucketFromUrl?: string } => {
  const input = (rawPath || "").trim();
  if (!input) return { path: "" };

  try {
    const parsedUrl = new URL(input);
    const decodedPath = decodeURIComponent(parsedUrl.pathname);
    const storageMatch = decodedPath.match(STORAGE_PATH_REGEX);

    if (storageMatch) {
      return {
        bucketFromUrl: storageMatch[1],
        path: storageMatch[2],
      };
    }

    return { path: decodedPath.replace(/^\/+/, "") };
  } catch {
    return { path: input.replace(/^\/+/, "") };
  }
};

const buildCandidateTargets = (rawPath: string): DownloadTarget[] => {
  const { path: normalizedPath, bucketFromUrl } = normalizeStoragePath(rawPath);
  if (!normalizedPath) return [];

  const candidates: DownloadTarget[] = [];

  if (bucketFromUrl === "applications" || bucketFromUrl === "resumes") {
    candidates.push({ bucket: bucketFromUrl, path: normalizedPath });
  }

  if (normalizedPath.startsWith("applications/applications/")) {
    candidates.push({ bucket: "applications", path: normalizedPath.replace(/^applications\//, "") });
    candidates.push({ bucket: "resumes", path: normalizedPath });
  } else if (normalizedPath.startsWith("applications/")) {
    candidates.push({ bucket: "resumes", path: normalizedPath });
    candidates.push({ bucket: "applications", path: normalizedPath.replace(/^applications\//, "") });
  } else {
    candidates.push({ bucket: "applications", path: normalizedPath });
    candidates.push({ bucket: "resumes", path: normalizedPath });
  }

  const deduped = new Map<string, DownloadTarget>();
  candidates.forEach((candidate) => {
    if (!candidate.path) return;
    deduped.set(`${candidate.bucket}:${candidate.path}`, candidate);
  });

  return [...deduped.values()];
};

export const downloadApplicationDocument = async (rawPath: string): Promise<DownloadSuccess | null> => {
  const candidates = buildCandidateTargets(rawPath);

  for (const candidate of candidates) {
    const { data, error } = await supabase.storage.from(candidate.bucket).download(candidate.path);
    if (!error && data) {
      return {
        blob: data,
        bucket: candidate.bucket,
        path: candidate.path,
      };
    }

    console.error("[document-download] Candidate failed", {
      bucket: candidate.bucket,
      path: candidate.path,
      error,
    });
  }

  return null;
};

export const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};

export const buildSafeDocumentName = (params: {
  label: string;
  firstName?: string | null;
  lastName?: string | null;
  rawPath?: string | null;
}) => {
  const first = cleanSegment(params.firstName || "Bewerber");
  const last = cleanSegment(params.lastName || "Profil");
  const label = cleanSegment(params.label || "Dokument");

  const rawTail = params.rawPath?.split("/").pop() || "";
  const fromStorage = rawTail.replace(/^(resume|certificates|cover_letter)_\d+_/, "");
  const hasPdfExtension = /\.pdf$/i.test(fromStorage);

  if (fromStorage) {
    const base = cleanSegment(fromStorage.replace(/\.pdf$/i, ""));
    return `${label}_${first}_${last}_${base}${hasPdfExtension ? ".pdf" : ".pdf"}`;
  }

  return `${label}_${first}_${last}.pdf`;
};
