// ==========================================
//        ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================
// Lightweight role guard. In a real app, replace this with
// verified auth (JWT/session) that sets req.user.role.

function resolveRole(req) {
  return (
    req.user?.role ||
    req.headers["x-role"] ||
    req.headers["role"] ||
    req.headers["x-user-role"] ||
    req.body?.role ||
    req.query?.role ||
    null
  );
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = resolveRole(req);
    const enforce = process.env.ENFORCE_ROLE === "true";

    if (!role) {
      if (enforce) return res.status(401).json({ message: "Role required" });
      // permissive fallback for legacy clients
      return next();
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { requireRole };
