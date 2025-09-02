import { updateImageUrls } from "./utils/db.js";

export async function handler(event) {
  try {
    // Optional: Verify webhook signature for security
    const signature = event.headers["cf-webhook-auth"];
    if (signature !== process.env.CLOUDFLARE_WEBHOOK_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid webhook signature" }) };
    }

    const payload = JSON.parse(event.body);
    console.log("Cloudflare webhook payload:", payload);

    // Extract data from Cloudflare webhook
    const { id, variants, metadata, filename } = payload;
    
    if (!metadata || !metadata.userId || !metadata.type) {
      console.error("Missing required metadata in webhook payload");
      return { statusCode: 400, body: JSON.stringify({ error: "Missing metadata" }) };
    }

    const { userId, type } = metadata;

    // Generate variant URLs using Cloudflare Images delivery
    const baseUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_HASH}/${id}`;
    
    const imageUrls = {
      originalUrl: `${baseUrl}/public`,
      thumbnailUrl: `${baseUrl}/w=150,h=150,fit=cover`,
      optimizedUrl: `${baseUrl}/w=1080,h=1080,fit=scale-down,f=webp,q=85`,
    };

    // Update DB with processed URLs
    await updateImageUrls({
      userId,
      type,
      ...imageUrls,
      variants: variants || {},
    });

    console.log(`Successfully processed image for user ${userId}, type ${type}`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        success: true, 
        message: "Image processed and URLs updated",
        imageId: id
      }),
    };
  } catch (err) {
    console.error("Webhook processing error:", err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
}
