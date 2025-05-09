const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// API endpoint for WorkWise SA
exports.api = onRequest({
  region: "us-central1",
  cors: true,
}, (request, response) => {
  if (request.path === "/api/jobs") {
    // Example job listings
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
    response.json({jobs});
  } else if (request.path === "/api/categories") {
    // Example job categories
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
    response.json({categories});
  } else {
    response.status(404).send("Not found");
  }
});
