import { verifyFirebaseAuth } from "./utils/auth.js";
import { getUserImage } from "./utils/db.js";

export async function handler(event) {
  try {
    // Verify authentication
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const user = await verifyFirebaseAuth(token);

    const { type } = event.queryStringParameters || {};
    
    if (type && !["profile", "professional"].includes(type)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Invalid type. Must be 'profile' or 'professional'" })
      };
    }

    let images = {};

    if (type) {
      // Get specific image type
      const image = await getUserImage(user.uid, type);
      if (image) {
        images[type] = image;
      }
    } else {
      // Get both profile and professional images
      const profileImage = await getUserImage(user.uid, "profile");
      const professionalImage = await getUserImage(user.uid, "professional");
      
      if (profileImage) images.profile = profileImage;
      if (professionalImage) images.professional = professionalImage;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({
        success: true,
        images,
        userId: user.uid
      }),
    };
  } catch (err) {
    console.error("Get user images error:", err);
    return { 
      statusCode: err.message.includes("Invalid Firebase token") ? 401 : 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
}
