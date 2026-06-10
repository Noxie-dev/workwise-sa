import { Router } from "express";
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

router.get("/me", async (req, res, next) => {
  try {
    const dbUser = await resolveOptionalUser(req);
    res.json(await entitlementService.getEntitlementsForUser(dbUser?.id));
  } catch (error) {
    next(error);
  }
});

export default router;
