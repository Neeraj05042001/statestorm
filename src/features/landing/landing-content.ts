export const githubUrl = "https://github.com/Neeraj05042001/statestorm";
export const liveDemoUrl = "/preflight?demo=1";

export const navigationLinks = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Evidence", href: "#evidence" },
  { label: "Architecture", href: "#architecture" },
] as const;

export const trustSignals = [
  { label: "Live prototype", icon: "pulse" },
  { label: "271 tests passing", icon: "check" },
  { label: "Deterministic fallback", icon: "shield" },
  { label: "No sign-up", icon: "lock" },
] as const;

export const evidenceCategories = [
  {
    key: "runtime",
    title: "Runtime crash",
    preview: "Contained exception",
    description:
      "The component throws while rendering. The error is recorded and later states keep running.",
  },
  {
    key: "blank",
    title: "Blank render",
    preview: "No meaningful UI",
    description:
      "Execution completes, but the rendered state contains no meaningful interface.",
  },
  {
    key: "overflow",
    title: "Possible overflow",
    preview: "Measured boundary",
    description:
      "Browser dimensions reveal content extending beyond its rendered boundary.",
  },
  {
    key: "broken",
    title: "Broken image",
    preview: "Unusable dimensions",
    description:
      "A completed image has no usable natural dimensions, producing recorded evidence.",
  },
] as const;

export const workflowStages = [
  { number: "01", title: "Prompt + component", icon: "source" },
  { number: "02", title: "Contract analysis", icon: "contract" },
  { number: "03", title: "AI + boundary states", icon: "spark" },
  { number: "04", title: "Validated RunPlan", icon: "plan" },
  { number: "05", title: "Isolated execution", icon: "cube" },
  { number: "06", title: "State Atlas", icon: "atlas" },
] as const;

export const technicalMetrics = [
  { value: "12", label: "maximum prioritized states", tone: "violet" },
  { value: "271", label: "passing tests", tone: "cyan" },
  { value: "1", label: "serialized active execution", tone: "green" },
  {
    value: "0",
    label: "submitted source executed by the server",
    tone: "coral",
  },
] as const;

export const technicalLabels = [
  "TypeScript Compiler API",
  "Zod contracts",
  "Gemini structured output",
  "Sandpack isolation",
  "Stale-result rejection",
  "Deterministic fallback",
] as const;
