/**
 * routes/logs.js
 *
 * The frontend half of the "Google Cloud Logging" requirement.
 * services/loggingService.js's Cloud Logging SDK only runs in Node, not
 * the browser, so this is how browser-side events and errors still end
 * up as real Cloud Logging entries: the frontend (src/services/logger.js)
 * POSTs here, and this just forwards into the same log stream
 * loggingService.js writes to, tagged `source: "frontend"` so the two
 * are easy to tell apart (see the report's "frontend implementation" /
 * "backend implementation" sections).
 *
 * Deliberately NOT behind verifyGoogleToken: logging should work even
 * for a signed-out visitor browsing Home/About/Contact, and a failed
 * auth check here would itself be something worth being able to log.
 */
import { Router } from "express";
import { logApiCall } from "../services/loggingService.js";

const router = Router();

router.post("/", async (req, res) => {
  const { event, detail, error } = req.body || {};
  if (!event) return res.status(400).json({ error: "event is required" });

  await logApiCall({ source: "frontend", api: "frontend", event, detail, error });
  res.status(204).end();
});

export default router;
