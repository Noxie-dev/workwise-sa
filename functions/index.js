const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK outside of the function handlers
admin.initializeApp();

// Deploy functions to a region closer to your users (e.g., europe-west1)
const region = "europe-west1";

exports.jobs = onRequest({ region, cors: true }, (request, response) => {
  logger.info("Jobs function triggered", {structuredData: true});
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
});

exports.categories = onRequest({ region, cors: true }, (request, response) => {
  logger.info("Categories function triggered", {structuredData: true});
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
});