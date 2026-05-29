import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

export async function verifyAuthToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  const decoded = await adminAuth().verifyIdToken(token);
  return decoded.uid;
}
