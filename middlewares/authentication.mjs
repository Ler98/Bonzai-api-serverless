import createError from "http-errors";
import { verifyToken } from "../utils/jwt.mjs";

export const authenticate = () => ({
  before: (handler) => {
    const authHeader = handler.event.headers?.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError(401, "Unauthorized");
    }
    const token = authHeader.slice(7);
    try {
      handler.event.user = verifyToken(token);
    } catch {
      throw createError(401, "Invalid or expired token");
    }
  },
});

export const optionalAuthenticate = () => ({
  before: (handler) => {
    const authHeader = handler.event.headers?.authorization;

    // om det inte finns nån token fortsätter man som utloggad
    if (!authHeader) {
      return;
    }

    // kontrollerar om auth stämmer
    if (!authHeader.startsWith("Bearer ")) {
      throw createError(401, "Invalid authorization header");
    }

    const token = authHeader.slice(7);

    try {
      handler.event.user = verifyToken(token);
    } catch {
      throw createError(401, "Invalid or expired token");
    }
  },
});
