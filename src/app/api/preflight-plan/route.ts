import { planSubmission } from "../../../server/preflight-planning";
import { createPreflightPlanPostHandler } from "./route-handler";

export const runtime = "nodejs";

export const POST = createPreflightPlanPostHandler(planSubmission);
