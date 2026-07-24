const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

// Express app for API routes
const app = express();
app.use(cors({origin: true}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));

async function requireFirebaseUser(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return res.status(401).json({error: "Authentication required"});
  }

  try {
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    logger.warn("Rejected invalid Firebase token", {error: error.message});
    return res.status(401).json({error: "Invalid authentication token"});
  }
}

function requireOwnProfile(req, res, next) {
  const requestedUserId = String(req.params.userId || "");
  const isAdmin = req.user?.admin === true || req.user?.role === "admin";
  if (isAdmin || requestedUserId === req.user?.uid) {
    return next();
  }

  return res.status(403).json({error: "You can only access your own profile"});
}

function unavailableLegacyEndpoint(_req, res) {
  return res.status(501).json({
    error: "This legacy Firebase endpoint is disabled; use the authenticated canonical API",
  });
}

// Import your existing server routes
// Note: You'll need to adapt your existing routes to work with Firebase Functions
app.get("/health", (req, res) => {
  res.json({status: "ok", timestamp: new Date().toISOString()});
});

// Jobs endpoints
app.get("/jobs", (req, res) => {
  const jobs = [
    {
      id: "job1",
      title: "General Worker",
      company: "ABC Construction",
      location: "Cape Town",
      type: "Full-time",
      description: "General labor work at construction sites",
    },
    {
      id: "job2",
      title: "Warehouse Assistant",
      company: "XYZ Logistics",
      location: "Johannesburg",
      type: "Part-time",
      description: "Assist with warehouse operations and inventory management",
    },
  ];
  res.json({jobs});
});

// Categories endpoints
app.get("/categories", (req, res) => {
  const categories = [
    "General Worker",
    "Construction Worker",
    "Picker/Packer",
    "Warehouse Assistant",
    "Cashier",
    "Cleaner",
    "Security Guard",
    "Admin Clerk",
  ];
  res.json({categories});
});

// File upload endpoints
app.post("/files/upload-profile-image", requireFirebaseUser, unavailableLegacyEndpoint);

app.post("/files/upload-professional-image", requireFirebaseUser, unavailableLegacyEndpoint);

// Profile endpoints
app.get("/profile/:userId", requireFirebaseUser, requireOwnProfile, unavailableLegacyEndpoint);

app.put("/profile/:userId", requireFirebaseUser, requireOwnProfile, unavailableLegacyEndpoint);

// Export the Express app as a Firebase Function
exports.api = onRequest({
  region: "us-central1",
  cors: true,
  memory: "1GiB",
  timeoutSeconds: 300,
}, app);

// Cloud Function for file processing
exports.processProfileImage = onCall({
  region: "us-central1",
  memory: "512MiB",
}, async (request) => {
  const {imageUrl, userId} = request.data;

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if (request.auth.token.admin !== true && request.auth.token.role !== "admin" && userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "You can only process your own profile image");
  }
  
  try {
    // TODO: Implement image processing logic
    logger.info(`Processing profile image for user ${userId}`, {imageUrl});
    
    return {
      success: true,
      processedImageUrl: imageUrl,
      message: "Image processed successfully",
    };
  } catch (error) {
    logger.error("Error processing profile image", error);
    throw new Error("Failed to process profile image");
  }
});

// Cloud Function for CV processing
exports.processCVUpload = onCall({
  region: "us-central1",
  memory: "1GiB",
}, async (request) => {
  const {cvUrl, userId} = request.data;

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if (request.auth.token.admin !== true && request.auth.token.role !== "admin" && userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "You can only process your own CV");
  }
  
  try {
    // TODO: Implement CV processing logic
    logger.info(`Processing CV for user ${userId}`, {cvUrl});
    
    return {
      success: true,
      extractedData: {},
      message: "CV processed successfully",
    };
  } catch (error) {
    logger.error("Error processing CV", error);
    throw new Error("Failed to process CV");
  }
});
