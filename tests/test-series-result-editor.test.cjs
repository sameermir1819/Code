const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

// Exercise component events and refreshed props without a browser or database.
function editor() {
  const state = [];
  let cursor = 0;
  let refreshes = 0;
  const submissions = [];
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
    },
    useTransition: () => [false, (callback) => callback()],
  };
  const result = { registrationId: "reg-1", marksObtained: 72, maxMarks: 100, attendance: "PRESENT", correctCount: 18, incorrectCount: 2, unattemptedCount: 5, remarks: "Original", updatedAt: "2026-09-01T00:00:00.000Z" };
  const exam = { id: "exam-1", title: "Mock", maxMarks: 100, status: "RESULTS_PUBLISHED", results: [result], examDate: "2026-09-01" };
  const props = {
    seriesList: [{ id: "series-1", instituteId: "campus-a", title: "Series", code: "TS", fee: 0, status: "ACTIVE", startDate: "2026-09-01", endDate: "2026-10-01", exams: [exam], registrations: [{ id: "reg-1", rollNumber: "ROLL-1", externalStudentName: "Aisha" }] }],
    stats: { totalPrograms: 1, totalRegistrations: 1, totalRevenueCollected: 0, totalExamsScheduled: 1 },
    enrolledStudents: [],
    canViewResults: true,
    canManageResults: true,
  };
  const file = path.join(__dirname, "../src/app/(dashboard)/test-series/test-series-client.tsx");
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(id) {
      if (id === "react") return hooks;
      if (id === "next/link") return "a";
      if (id === "next/navigation") return { useRouter: () => ({ refresh: () => { refreshes++; } }) };
      if (id === "@/server/actions/test-series") return { submitTestResults: async (examId, payload) => {
        submissions.push({ examId, payload });
        Object.assign(result, payload[0]);
        return { success: true, count: payload.length };
      } };
      if (id.startsWith("@/components/ui/") || id === "lucide-react") return new Proxy({}, { get: (_, key) => String(key) });
      throw new Error(`Unexpected dependency ${id}`);
    },
  });
  function flatten(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(flatten);
    return [node, ...flatten(node.props?.children)];
  }
  function render() { cursor = 0; return flatten(exports.TestSeriesClient(props)); }
  function text(node) {
    if (node == null || typeof node === "boolean") return "";
    if (Array.isArray(node)) return node.map(text).join("");
    return typeof node === "object" ? text(node.props?.children) : String(node);
  }
  function button(label) { return render().find((node) => ["button", "Button"].includes(node.type) && text(node) === label); }
  button("Results Entry & Ranking").props.onClick();
  render().find((node) => node.type === "select" && node.props.value === "").props.onChange({ target: { value: "exam-1" } });
  return {
    render, button, result, submissions,
    pencil: () => render().find((node) => node.props?.["aria-label"] === "Edit result for Aisha"),
    marks: () => render().find((node) => node.type === "Input" && node.props.max === 100),
    refreshes: () => refreshes,
  };
}

test("pencil loads saved values, cancel discards edits, and refreshed result props are displayed", () => {
  const e = editor();
  assert.equal(e.marks().props.value, 72);
  e.pencil().props.onClick();
  assert.equal(e.marks().props.disabled, false);
  e.marks().props.onChange({ target: { value: "88" } });
  assert.equal(e.marks().props.value, 88);
  e.button("Cancel").props.onClick();
  assert.equal(e.marks().props.value, 72);
  e.result.marksObtained = 91;
  assert.equal(e.marks().props.value, 91);
  e.pencil().props.onClick();
  assert.equal(e.marks().props.value, 91);
});

test("saving a pencil edit sends the selected candidate and displays the saved result after refresh", async () => {
  const e = editor();
  e.pencil().props.onClick();
  e.marks().props.onChange({ target: { value: "85" } });
  await e.button("Save").props.onClick();
  assert.equal(e.submissions.length, 1);
  assert.equal(e.submissions[0].examId, "exam-1");
  assert.equal(e.submissions[0].payload.length, 1);
  assert.equal(e.submissions[0].payload[0].marksObtained, 85);
  assert.equal(e.submissions[0].payload[0].correctCount, 18);
  assert.equal(e.submissions[0].payload[0].expectedUpdatedAt, "2026-09-01T00:00:00.000Z");
  assert.equal(e.refreshes(), 1);
  assert.equal(e.marks().props.value, 85);
  assert.ok(e.pencil());
});
