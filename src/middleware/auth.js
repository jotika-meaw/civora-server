const { createRemoteJWKSet, jwtVerify } = require("jose");

let remoteJWKS = null;
function getRemoteJWKS() {
  const url = process.env.BETTER_AUTH_JWKS_URL;
  if (!url) return null;
  if (!remoteJWKS) remoteJWKS = createRemoteJWKSet(new URL(url));
  return remoteJWKS;
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function normalizePayload(payload) {
  // Better Auth JWT: sub = user id, email claim present
  const id = payload.sub || payload.userId || payload.id;
  const email = payload.email || payload.user_email || null;
  const name = payload.name || null;
  const image = payload.image || payload.picture || null;
  return { id, email, name, image, raw: payload };
}

// Optional auth: attaches req.user when a valid token is present,
// otherwise continues as anonymous. Used for public reads that
// personalize (e.g. isJoined on event details).
async function optionalAuth(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) return next();
  try {
    req.user = await verifyToken(token);
  } catch {
    // ignore invalid tokens on optional routes
  }
  next();
}

async function verifyToken(token) {
  const jwks = getRemoteJWKS();
  const issuer = process.env.JWT_ISSUER || undefined;
  const audience = process.env.JWT_AUDIENCE || undefined;

  if (jwks) {
    const { payload } = await jwtVerify(token, jwks, {
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
    const user = normalizePayload(payload);
    if (!user.id) throw new Error("Invalid token: missing sub");
    return user;
  }

  // Local-dev fallback: HS256 with shared BETTER_AUTH_SECRET
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    const err = new Error(
      "No JWT verifier configured. Set BETTER_AUTH_JWKS_URL or BETTER_AUTH_SECRET."
    );
    err.status = 500;
    throw err;
  }
  const { TextEncoder } = require("util");
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  });
  const user = normalizePayload(payload);
  if (!user.id) throw new Error("Invalid token: missing sub");
  return user;
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing Bearer token" });
  }
  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireAuth, optionalAuth, verifyToken };
