"use me";
"use client";
import { usePermissions } from "@/components/layout/permission-provider";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStudyMaterial, deleteStudyMaterial, trackMaterialDownload } from "@/server/actions/materials";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  BookOpen,
  Plus,
  Link as LinkIcon,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Filter,
  FileCode,
  Video,
  FileCheck,
  Globe,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface MaterialItem {
  id: string;
  title: string;
  description?: string | null;
  fileType: string;
  fileUrl: string;
  fileSize?: string | null;
  downloadsCount: number;
  createdAt: Date;
  subject?: { id: string; name: string } | null;
  course?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  uploadedBy?: { id: string; name?: string | null } | null;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

interface MaterialsManagerProps {
  initialMaterials: MaterialItem[];
  subjects: SubjectItem[];
  userRole: string;
}

export function MaterialsManager({ initialMaterials, subjects, userRole }: MaterialsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    fileType: "LINK",
    fileUrl: "",
    fileSize: "Web Link",
    subjectId: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const isStaff = usePermissions().includes("materials.manage");

  const filteredMaterials = initialMaterials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.subject?.name && m.subject.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "ALL" || m.fileType === selectedType;
    const matchesSubject = selectedSubject === "ALL" || m.subject?.id === selectedSubject;

    return matchesSearch && matchesType && matchesSubject;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setForm((prev) => ({
          ...prev,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize || "1.0 MB",
          fileType: data.fileType || "PDF",
          title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        }));
        setFeedback({ type: "success", message: "File uploaded successfully!" });
      } else {
        setFeedback({ type: "error", message: data.message || "Failed to upload file" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Upload error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.title.trim()) {
      return setFeedback({ type: "error", message: "Title is required" });
    }
    if (!form.fileUrl.trim()) {
      return setFeedback({
        type: "error",
        message: uploadMode === "link" ? "Notes URL / Link is required" : "Please upload a file first",
      });
    }

    startTransition(async () => {
      try {
        const res = await createStudyMaterial({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          fileType: uploadMode === "link" ? "LINK" : form.fileType,
          fileUrl: form.fileUrl.trim(),
          fileSize: uploadMode === "link" ? "Web Link" : form.fileSize,
          subjectId: form.subjectId || undefined,
        });

        if (res.success) {
          setShowModal(false);
          setForm({
            title: "",
            description: "",
            fileType: "LINK",
            fileUrl: "",
            fileSize: "Web Link",
            subjectId: "",
          });
          setFeedback({ type: "success", message: "Notes / Material added successfully!" });
          router.refresh();
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to add material" });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    startTransition(async () => {
      try {
        await deleteStudyMaterial(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Failed to delete material");
      }
    });
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Materials & Notes</h1>
          <p className="text-sm text-muted-foreground">
            Curriculum notes, external drive links, Daily Practice Problems (DPP), and reference material.
          </p>
        </div>
        {isStaff && (
          <Button
            onClick={() => {
              setFeedback(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Notes / Link</span>
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-4 rounded-xl border">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search notes, topics, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-9 px-3 rounded-md border text-xs bg-background text-foreground"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-md border text-xs bg-background text-foreground"
          >
            <option value="ALL">All Formats</option>
            <option value="LINK">Web Link / URL 🔗</option>
            <option value="PDF">PDF Documents 📄</option>
            <option value="DOCUMENT">Doc / Presentation 📝</option>
            <option value="IMAGE">Image / Diagrams 🖼️</option>
            <option value="VIDEO">Video Lecture 🎥</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground text-sm">No study materials or notes found</p>
            <p className="max-w-md">
              Try adjusting your search filter or click <strong>&quot;Upload Notes / Link&quot;</strong> to add notes or Google Drive URL links.
            </p>
          </Card>
        ) : (
          filteredMaterials.map((m) => {
            const isLink = m.fileType === "LINK" || m.fileUrl.startsWith("http");

            return (
              <Card key={m.id} className="flex flex-col justify-between hover:shadow-md transition-shadow border-muted-foreground/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <Badge
                      variant={isLink ? "default" : "secondary"}
                      className="text-[10px] uppercase font-mono flex items-center gap-1"
                    >
                      {isLink ? <LinkIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      <span>{m.fileType || "LINK"}</span>
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {m.fileSize || (isLink ? "Web Link" : "File")}
                    </span>
                  </div>

                  <CardTitle className="text-base font-bold mt-2 text-foreground line-clamp-1">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {m.description || "Curriculum study notes & reference materials"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3 text-xs">
                  <div className="p-2 rounded bg-muted/30 border text-[11px] flex items-center justify-between">
                    <span className="text-muted-foreground">Subject:</span>
                    <strong className="text-foreground font-semibold">
                      {m.subject?.name || "General Notes"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                    <span>Added: {formatDate(m.createdAt)}</span>
                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id, m.title)}
                        className="text-destructive hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {isLink ? (
                      <>
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open Notes Link</span>
                        </a>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          title="Copy Link"
                          onClick={() => handleCopyLink(m.id, m.fileUrl)}
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        download
                        onClick={() => trackMaterialDownload(m.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-semibold border transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Attachment</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload / Add Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">Add Study Material / Notes</h3>
                <p className="text-xs text-muted-foreground">
                  Upload a file directly or attach a web URL link (Google Drive, Notion, PDF, etc.)
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-muted border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUploadMode("link")}
                className={`py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                  uploadMode === "link"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Web Link / URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                  uploadMode === "file"
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Notes / Material Title *</label>
                <Input
                  required
                  placeholder="e.g. Organic Chemistry Reaction Mechanism Notes"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border text-xs bg-background text-foreground"
                >
                  <option value="">Select Subject (Optional)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {uploadMode === "link" ? (
                <div>
                  <label className="font-semibold block mb-1">Notes Web URL / Link *</label>
                  <Input
                    required
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value, fileType: "LINK" })}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Paste Google Drive, Dropbox, Notion, YouTube, or web PDF URL link.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="font-semibold block mb-1">Upload File (PDF / Doc / Image)</label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/20">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-input"
                    />
                    <label
                      htmlFor="file-upload-input"
                      className="cursor-pointer inline-flex flex-col items-center gap-1"
                    >
                      <Upload className="h-6 w-6 text-primary" />
                      <span className="font-semibold text-primary">
                        {isUploading ? "Uploading file..." : "Click to select file from computer"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">PDF, DOC, DOCX, PNG, JPG up to 50MB</span>
                    </label>
                  </div>
                  {form.fileUrl && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      ✓ Attached: {form.fileUrl} ({form.fileSize})
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Description / Chapters Covered</label>
                <Input
                  placeholder="e.g. Includes Mindmaps, Formulas & JEE Main Previous Year Questions"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || isUploading}>
                  {isPending ? "Adding Material..." : "Add Notes & Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

