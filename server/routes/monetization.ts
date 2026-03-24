import { Router } from "express";
import {
  adEventSchema,
  adPlacementSchema,
  defaultAdSlots,
} from "@shared/monetization";
import { logger } from "../utils/logger";

const router = Router();

router.get("/slots/:placement", (req, res) => {
  const parsedPlacement = adPlacementSchema.safeParse(req.params.placement);
  if (!parsedPlacement.success) {
    return res.status(400).json({ message: "Invalid ad placement" });
  }

  return res.json(defaultAdSlots[parsedPlacement.data]);
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
