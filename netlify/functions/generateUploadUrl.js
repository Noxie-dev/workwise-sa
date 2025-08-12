import fetch from "node-fetch";
import { verifyFirebaseAuth } from "./utils/auth.js";
import { saveImageMetadata } from "./utils/db.js";

export async function handler(event) {
  try {
    // Verify authentication
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const user = await verifyFirebaseAuth(token);

    const { type } = JSON.parse(event.body);
    if (!["profile", "professional"].includes(type)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "Invalid type. Must be 'profile' or 'professional'" })
      };
    }

    // Generate Cloudflare Images direct-upload URL
    const cfUploadRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        metadata: { 
          userId: user.uid, 
          type,
          email: user.email 
        }
      }),
    });

    const cfData = await cfUploadRes.json();
    if (!cfData.success) {
      throw new Error(`Cloudflare Images API error: ${JSON.stringify(cfData.errors)}`);
    }

    // Store initial metadata in DB (status: processing)
    await saveImageMetadata({
      userId: user.uid,
      type,
      cloudflareImageId: cfData.result.id,
      uploadedAt: new Date(),
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify({
        uploadUrl: cfData.result.uploadURL,
        imageId: cfData.result.id,
        message: "Upload URL generated successfully"
      }),
    };
  } catch (err) {
    console.error("Upload URL generation error:", err);
    return { 
      statusCode: err.message.includes("Invalid Firebase token") ? 401 : 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
}
