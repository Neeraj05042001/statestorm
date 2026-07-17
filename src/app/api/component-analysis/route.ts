import { analyzeSubmission } from "../../../server/component-analysis";
import { createComponentAnalysisPostHandler } from "./route-handler";

export const runtime = "nodejs";

export const POST = createComponentAnalysisPostHandler(analyzeSubmission);
