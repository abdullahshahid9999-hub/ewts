import { NextRequest } from "next/server";
import { verifyAccessToken, isAllowedAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Extracts the bearer access token from the Authorization header.
 * Access tokens are short-lived and sent this way (not cookies) —
 * refresh tokens are the ones that live in httpOnly cookies.
 */
function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

/**
 * Verifies the request carries a valid agent JWT and returns the agent's
 * row from the database (so callers always work with fresh DB state, e.g.
 * current status, rather than trusting stale JWT claims for anything but
 * identity). Returns null if unauthenticated/invalid — callers must
 * respond 401 in that case.
 */
export async function requireAgent(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "agent") return null;

  const agent = await prisma.agent.findUnique({ where: { id: payload.sub } });
  if (!agent || agent.status !== "active") return null;

  return agent;
}

/**
 * Verifies the request carries a valid admin JWT AND that the email is on
 * the ADMIN_EMAILS allow-list — a valid token alone is not sufficient for
 * admin routes.
 */
export async function requireAdmin(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "admin") return null;

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !isAllowedAdminEmail(admin.email)) return null;

  return admin;
}

/**
 * Strips fields that agents must never be able to set themselves, even if
 * an admin-facing field name is included in a request body. Call this on
 * every agent-authenticated write route that touches the Agent model.
 */
export function stripAgentWriteOnlyFields<T extends Record<string, unknown>>(body: T): T {
  const clone = { ...body };
  delete (clone as Record<string, unknown>).balance;
  delete (clone as Record<string, unknown>).creditLimit;
  delete (clone as Record<string, unknown>).credit_limit;
  delete (clone as Record<string, unknown>).tier;
  delete (clone as Record<string, unknown>).commission;
  return clone;
}
