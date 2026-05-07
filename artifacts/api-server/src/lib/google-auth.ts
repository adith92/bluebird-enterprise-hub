import { OAuth2Client, type TokenPayload } from "google-auth-library";

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (client) return client;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is required for Google sign-in");
  }
  client = new OAuth2Client(clientId);
  return client;
}

export async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
  const c = getClient();
  const ticket = await c.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token payload");
  return payload;
}

