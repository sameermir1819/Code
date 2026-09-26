"use client";

import React, { useState } from "react";
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  ArrowUpDown,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: Date | string;
  status: string;
  remarks?: string | null;
  checkInAt?: Date | string | null;
  checkOutAt?: Date | string | null;
  batch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export function StudentAttendanceClient({
  records,
  studentName,
}: {
  records: AttendanceRecord[];
  studentName: string;
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

  const filtered = records.filter((rec) => {
    if (filter !== "ALL" && rec.status !== filter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const batchName = rec.batch?.name?.toLowerCase() || "";
      const dateStr = new Date(rec.date).toLocaleDateString().toLowerCase();
      return batchName.includes(q) || dateStr.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Attendance Ledger</h1>
          <p className="text-xs text-zinc-400">
            QR card attendance and daily class participation history for {studentName}.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[11px] text-zinc-400 block font-medium">Overall Rate</span>
          <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
            {rate}%
          </span>
          <span className="text-[10px] text-emerald-400 block mt-1 font-medium">
            Attendance Record
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[11px] text-emerald-300 block font-medium">Present Days</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-0.5">
            {present}
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-1 font-medium">
            Full sessions
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[11px] text-amber-300 block font-medium">Late Marks</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 block mt-0.5">
            {late}
          </span>
          <span className="text-[10px] text-amber-300/80 block mt-1 font-medium">
            Half credit
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-[11px] text-rose-300 block font-medium">Absent Days</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 block mt-0.5">
            {absent}
          </span>
          <span className="text-[10px] text-rose-300/80 block mt-1 font-medium">
            Requires parent slip
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PRESENT", "LATE", "ABSENT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {tab === "ALL" ? `All (${total})` : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search date or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No attendance records match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date &amp; Day</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-in</th>
                  <th className="py-3 px-4">Check-out</th>
                  <th className="py-3 px-4 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => {
                  const d = new Date(r.date);
                  const formattedDate = d.toLocaleDateString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{formattedDate}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-zinc-200 font-medium block">
                          {r.batch?.name || "Main Academic Batch"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {r.batch?.code}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === "PRESENT"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : r.status === "LATE"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {r.status === "PRESENT" && <CheckCircle2 className="w-3 h-3" />}
                          {r.status === "LATE" && <Clock className="w-3 h-3" />}
                          {r.status === "ABSENT" && <XCircle className="w-3 h-3" />}
                          <span>{r.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400 text-[11px]">
                        {r.remarks || "Recorded by campus staff"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
