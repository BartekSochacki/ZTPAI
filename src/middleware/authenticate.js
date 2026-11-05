const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

function createAuthenticate(config) {
  return function authenticate(req, res, next) {
    const header = req.get("Authorization");
    if (!header) {
      return next(new UnauthorizedError("Missing Authorization header"));
    }

    const [scheme, token, ...rest] = header.split(" ");
    if (scheme !== "Bearer" || !token || rest.length > 0) {
      return next(new UnauthorizedError("Authorization header must have the format: Bearer <token>"));
    }

    let payload;
    try {
      payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(new UnauthorizedError("Token expired", "TOKEN_EXPIRED"));
      }
      return next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
    }

    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  };
}

module.exports = { createAuthenticate };
