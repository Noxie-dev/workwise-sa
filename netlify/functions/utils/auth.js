import fetch from "node-fetch";

export async function verifyFirebaseAuth(token) {
  if (!token) throw new Error("Missing auth token");
  
  // Firebase Admin REST validation
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token })
  });
  
  const data = await res.json();
  if (!data.users) throw new Error("Invalid Firebase token");
  
  return { 
    uid: data.users[0].localId, 
    email: data.users[0].email 
  };
}

// Alias for the function that job functions are expecting
export const verifyFirebaseToken = verifyFirebaseAuth;
