import createError from "http-errors";

export const authorize = (role) => ({
  before: (handler) => {
    const user = handler.event.user;
    if (!user) {
      throw createError(401, "User is not authenticated");
    }

    if (user.role !== role) {
      throw createError(403, "User is not authorized");
    }
  },
});
