import * as jose from "jose";

export type InviteJwtPayload = {
  email: string;
  tenant_id: string;
  role: string;
  jti: string;
};

export async function signInviteToken(payload: InviteJwtPayload): Promise<string> {
  const secret = process.env.INVITE_JWT_SECRET;
  if (!secret) throw new Error("INVITE_JWT_SECRET is not set");
  const key = new TextEncoder().encode(secret);
  return new jose
    .SignJWT({
      email: payload.email,
      tenant_id: payload.tenant_id,
      role: payload.role,
    })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("72h")
    .setJti(payload.jti)
    .sign(key);
}

export async function verifyInviteToken(
  token: string,
): Promise<InviteJwtPayload | null> {
  const secret = process.env.INVITE_JWT_SECRET;
  if (!secret) return null;
  const key = new TextEncoder().encode(secret);
  try {
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    const tenant_id =
      typeof payload.tenant_id === "string" ? payload.tenant_id : "";
    const role = typeof payload.role === "string" ? payload.role : "";
    const jti = typeof payload.jti === "string" ? payload.jti : "";
    if (!email || !tenant_id || !role || !jti) return null;
    return { email, tenant_id, role, jti };
  } catch {
    return null;
  }
}
