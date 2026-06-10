import { Router } from "express";
import {
  adEventSchema,
  adPlacementSchema,
  defaultAdSlots,
} from "@shared/monetization";
import { logger } from "../utils/logger";
import { auth } from "../firebase";
import { resolveAuthenticatedDatabaseUser } from "../services/authenticatedUser";
import { entitlementService } from "../services/entitlementService";

const router = Router();

async function resolveOptionalUser(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const decoded = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
  return resolveAuthenticatedDatabaseUser(decoded);
}

router.get("/slots/:placement", async (req, res, next) => {
  const parsedPlacement = adPlacementSchema.safeParse(req.params.placement);
  if (!parsedPlacement.success) {
    return res.status(400).json({ message: "Invalid ad placement" });
  }

  try {
    const dbUser = await resolveOptionalUser(req);
    const entitlements = await entitlementService.getEntitlementsForUser(dbUser?.id);
    const slot = defaultAdSlots[parsedPlacement.data];

    return res.json({
      ...slot,
      enabled: slot.enabled && entitlements.adsEnabled,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/events", (req, res) => {
  const parsedEvent = adEventSchema.safeParse(req.body);
  if (!parsedEvent.success) {
    return res.status(400).json({
      message: "Invalid ad event payload",
      issues: parsedEvent.error.issues,
    });
  }

  logger.info("Monetization event received", {
    placement: parsedEvent.data.placement,
    eventType: parsedEvent.data.eventType,
    creativeId: parsedEvent.data.creativeId,
    sessionId: parsedEvent.data.sessionId,
  });

  return res.status(202).json({
    accepted: true,
    persisted: false,
    message: "Event accepted for future analytics persistence",
  });
});

export default router;
