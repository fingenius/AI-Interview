"use server";

import { getDb } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // or NextAuth.js setup
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie

interface SignUpParams {
  name?: string;
  email: string;
  password: string;
}

export async function signUp({ name, email, password }: SignUpParams) {
  const db = await getDb();
  const users = db.collection("users");

  // check existence
  const existing = await users.findOne({ email });
  if (existing) return { success: false, message: "Email in use" };

  // hash password
  const hash = await bcrypt.hash(password, 10);

  // insert user
  const result = await users.insertOne({ name, email, passwordHash: hash });
  return { success: true, userId: result.insertedId.toHexString() };
}

export async function signIn({ email, password }: SignUpParams) {
  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user) return { success: false, message: "No such user" };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { success: false, message: "Wrong password" };

  // create a JWT (or session cookie)
  const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  const cookieStore = await cookies();
  cookieStore.set("token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  return { success: true };
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

// Get current user from session cookie
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("token");
  const token = cookie?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };

    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(payload.sub) });
    return user
      ? { id: user._id.toHexString(), name: user.name, email: user.email }
      : null;
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
