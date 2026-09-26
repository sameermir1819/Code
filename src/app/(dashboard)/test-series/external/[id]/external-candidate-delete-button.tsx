"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteExternalCandidate } from "@/server/actions/test-series";

export function ExternalCandidateDeleteButton({
  candidateId,
  candidateName,
  registrationCount,
}: {
  candidateId: string;
  candidateName: string;
  registrationCount: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      const result = await deleteExternalCandidate(candidateId);
      if (!result.success) {
        setError(result.error || "External candidate delete nahi ho saka.");
        return;
      }
      router.push("/test-series");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "External candidate delete nahi ho saka.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        className="h-9 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete External User
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-3 border-b pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold">Delete External User?</h3>
                <p className="mt-1 text-xs text-muted-foreground">{candidateName}</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} disabled={isDeleting}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-destructive">
              Is external user ki {registrationCount} Test Series registration(s), linked results aur profile permanently delete ho jayenge. Yeh action undo nahi ho sakta.
            </p>
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete External User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
