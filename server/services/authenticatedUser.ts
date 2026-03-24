import type { User } from "@shared/schema";
import { storage } from "../storage";
import { Errors } from "../middleware/errorHandler";

type FirebaseLikeUser = {
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
};

function normalizeRole(role: unknown): string {
  return typeof role === "string" && role.trim() ? role : "user";
}

function defaultName(user: FirebaseLikeUser) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  if (user.email?.includes("@")) {
    return user.email.split("@")[0];
  }

  return "WorkWise User";
}

export async function resolveAuthenticatedDatabaseUser(authUser: FirebaseLikeUser): Promise<User> {
  if (!authUser?.uid) {
    throw Errors.authentication("User authentication required");
  }

  const existingUser = await storage.getUserByFirebaseUid(authUser.uid);
  if (existingUser) {
    return existingUser;
  }

  if (!authUser.email) {
    throw Errors.authentication("Authenticated Firebase user is missing an email");
  }

  return storage.createUser({
    username: `firebase-${authUser.uid.slice(0, 12)}`,
    password: null,
    email: authUser.email,
    name: defaultName(authUser),
    firebaseUid: authUser.uid,
    role: normalizeRole(authUser.role),
    location: null,
    bio: null,
    phoneNumber: null,
    willingToRelocate: false,
    notificationPreference: true,
  });
}

export function assertRole(user: Pick<User, "role">, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role ?? "user")) {
    throw Errors.forbidden("You do not have permission to access this resource");
  }
}
