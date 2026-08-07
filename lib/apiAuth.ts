import { NextRequest } from "next/server";
import { verifyAccessToken, isAllowedAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

// The shape returned by requireAgent — always has the parent agency's
// id so ALL existing routes work unchanged (balance, bookings, ledger etc.)
export type AgentSession = {
  id: string;            // ALWAYS parent agency id — use for all DB queries
  agentCode: string;
  fullName: string;
  email: string;
  tier: string;
  balance: number;
  creditLimit: number;
  status: string;
  phone: string | null;
  logoUrl: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  dtsLicense: boolean;
  dtsLicenseNumber: string | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  subUser: {
    id: string;
    fullName: string;
    email: string;
    designation: string | null;
    permissions: Record<string, boolean>;
  } | null;              // null = owner login
};

/**
 * Verifies agent OR sub-user JWT. Returns AgentSession whose .id is
 * always the parent agency — existing routes need zero changes.
 */
export async function requireAgent(req: NextRequest): Promise<AgentSession | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  if (payload.role === "agent") {
    const agent = await prisma.agent.findUnique({ where: { id: payload.sub } });
    if (!agent || agent.status !== "active") return null;
    return { ...agent, subUser: null };
  }

  if (payload.role === "agent_user") {
    const subUser = await prisma.agentUser.findUnique({
      where: { id: payload.sub },
      include: { agent: true },
    });
    if (!subUser || subUser.status !== "active") return null;
    if (subUser.agent.status !== "active") return null;
    return {
      ...subUser.agent,
      subUser: {
        id: subUser.id,
        fullName: subUser.fullName,
        email: subUser.email,
        designation: subUser.designation ?? null,
        permissions: (subUser.permissions ?? {}) as Record<string, boolean>,
      },
    };
  }

  return null;
}

export async function requireAdmin(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "admin") return null;

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !isAllowedAdminEmail(admin.email)) return null;

  return admin;
}

export function stripAgentWriteOnlyFields<T extends Record<string, unknown>>(body: T): T {
  const clone = { ...body };
  delete (clone as Record<string, unknown>).balance;
  delete (clone as Record<string, unknown>).creditLimit;
  delete (clone as Record<string, unknown>).credit_limit;
  delete (clone as Record<string, unknown>).tier;
  delete (clone as Record<string, unknown>).commission;
  return clone;
}

/** Sub-user permission check — owner always passes */
export function agentCan(session: AgentSession, permission: string): boolean {
  if (!session.subUser) return true; // owner
  return !!session.subUser.permissions[permission];
}
