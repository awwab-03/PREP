import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Shape the user object returned to the client (never include password). */
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

/**
 * POST /api/auth/register
 * Create a new account and return a JWT.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  res.status(201).json({ token, user: publicUser(user) });
});

/**
 * POST /api/auth/login
 * Verify credentials and return a JWT.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Need the password field (select:false on the schema) to compare.
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken(user._id);
  res.json({ token, user: publicUser(user) });
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user (from the JWT).
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
