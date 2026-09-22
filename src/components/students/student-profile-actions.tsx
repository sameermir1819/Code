"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStudent, updateStudentParent, enrollStudentInBatch } from "@/server/actions/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Edit3,
  GraduationCap,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  User,
  Phone,
  Mail,
  Home,
  Check,
} from "lucide-react";

interface StudentProfileActionsProps {
  student: any;
  activeEnrollment: any;
  availableBatches: any[];
}

export function StudentProfileActions({
  student,
  activeEnrollment,
  availableBatches = [],
}: StudentProfileActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAllotBatchModalOpen, setIsAllotBatchModalOpen] = useState(false);

  // Notifications
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Student Form State
  const [editTab, setEditTab] = useState<"student" | "parent">("student");
  const [formData, setFormData] = useState({
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    gender: student.gender || "MALE",
    dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
    address: student.address || "",
    city: student.city || "New Delhi",
    state: student.state || "Delhi",
    schoolCollege: student.schoolCollege || "",
    gradeClass: student.gradeClass || "Class 11",
    status: student.status || "ACTIVE",
    emergencyContact: student.emergencyContact || "",
    notes: student.notes || "",
    // Parent info
    parentName: student.parent?.name || "",
    parentPhone: student.parent?.phone || "",
    parentEmail: student.parent?.email || "",
    parentRelation: student.parent?.relation || "Father",
    parentOccupation: student.parent?.occupation || "",
  });

  // Batch Allotment State
  const [selectedBatchId, setSelectedBatchId] = useState(
    activeEnrollment?.batchId || activeEnrollment?.batch?.id || ""
  );

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFeedbackMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Student name cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        await updateStudent(student.id, {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          gender: formData.gender,
          dob: formData.dob || undefined,
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          schoolCollege: formData.schoolCollege.trim() || undefined,
          gradeClass: formData.gradeClass.trim() || undefined,
          status: formData.status,
          emergencyContact: formData.emergencyContact.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });

        if (formData.parentName.trim() && formData.parentPhone.trim()) {
          await updateStudentParent(student.id, {
            name: formData.parentName.trim(),
            phone: formData.parentPhone.trim(),
            email: formData.parentEmail.trim() || undefined,
            relation: formData.parentRelation,
            occupation: formData.parentOccupation.trim() || undefined,
          });
        }

        setFeedbackMsg("Student profile updated successfully!");
        setIsEditModalOpen(false);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to update student profile.");
      }
    });
  };

  const handleAllotBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      setErrorMsg("Please select a batch to allot.");
      return;
    }

    const chosenBatch = availableBatches.find((b) => b.id === selectedBatchId);
    if (!chosenBatch) {
      setErrorMsg("Selected batch not found.");
      return;
    }

    setErrorMsg("");
    setFeedbackMsg("");

    startTransition(async () => {
      try {
        await enrollStudentInBatch(student.id, chosenBatch.id, chosenBatch.courseId);
        setFeedbackMsg(`Student successfully allotted to "${chosenBatch.name}"!`);
        setIsAllotBatchModalOpen(false);
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to allot batch.");
      }
    });
  };

  return (
    <>
      {/* Action Buttons in Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setErrorMsg("");
            setFeedbackMsg("");
            setIsAllotBatchModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>{activeEnrollment ? "Change Batch" : "Allot Batch"}</span>
        </Button>

        <Button
          size="sm"
          onClick={() => {
            setErrorMsg("");
            setFeedbackMsg("");
            setIsEditModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Edit3 className="h-4 w-4" />
          <span>Edit Student</span>
        </Button>
      </div>

      {/* Global Feedback notification if set */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl text-xs flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="hover:opacity-80 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── 1. EDIT STUDENT MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Edit Student Profile: {student.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    ID: {student.studentId} • Admission: {student.admissionNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Segmented Tabs */}
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setEditTab("student")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editTab === "student"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Student Particulars
              </button>
              <button
                type="button"
                onClick={() => setEditTab("parent")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  editTab === "parent"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Parent / Guardian Details
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4 pt-1">
              {editTab === "student" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Full Legal Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Account Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="DROPPED">DROPPED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Phone Number
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="student@example.com"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="MALE">MALE</option>
                        <option value="FEMALE">FEMALE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Grade / Class
                      </label>
                      <Input
                        value={formData.gradeClass}
                        onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="e.g. Class 11, Class 12"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        School / Board
                      </label>
                      <Input
                        value={formData.schoolCollege}
                        onChange={(e) => setFormData({ ...formData, schoolCollege: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="e.g. DPS R.K. Puram (CBSE)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Residential Address
                      </label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Plot / House No, Street, Locality"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Emergency Contact
                      </label>
                      <Input
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Emergency phone"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Parent / Guardian Name
                      </label>
                      <Input
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="Guardian full name"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Relationship
                      </label>
                      <select
                        value={formData.parentRelation}
                        onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Guardian Phone Number
                      </label>
                      <Input
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-1">
                        Guardian Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        className="h-9 text-xs"
                        placeholder="parent@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Occupation / Profession
                    </label>
                    <Input
                      value={formData.parentOccupation}
                      onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                      className="h-9 text-xs"
                      placeholder="e.g. Government Service, Business, Doctor"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs font-semibold"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2. ALLOT BATCH MODAL ── */}
      {isAllotBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Allot Classroom Batch
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Assign {student.name} to an active classroom batch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllotBatchModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current Batch Info */}
            <div className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Currently Assigned:
                </span>
                <span className="font-bold text-sm text-foreground">
                  {activeEnrollment?.batch?.name || "No Batch (Unassigned)"}
                </span>
              </div>
              {activeEnrollment?.batch?.code && (
                <Badge variant="outline" className="font-mono text-[10px]">
                  {activeEnrollment.batch.code}
                </Badge>
              )}
            </div>

            {/* Available Batches Selection */}
            <form onSubmit={handleAllotBatch} className="space-y-4">
              <div>
                <label className="font-semibold text-foreground block mb-2">
                  Select Target Classroom Batch:
                </label>
                {availableBatches.length === 0 ? (
                  <p className="text-muted-foreground italic text-center p-4 border rounded-lg">
                    No active batches available. Please create a batch first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {availableBatches.map((b) => {
                      const isSelected = selectedBatchId === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setSelectedBatchId(b.id)}
                          className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                              : "border-input bg-card hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">{b.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {b.code}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Course: {b.course?.name || "General"} • Room: {b.room || "Room 101"} • Cap: {b.capacity} seats
                            </p>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? "bg-primary border-primary text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAllotBatchModalOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !selectedBatchId || availableBatches.length === 0}
                  className="text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isPending ? "Allotting..." : "Confirm Allotment"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

