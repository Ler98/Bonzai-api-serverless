import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { validateBody } from "../../../middlewares/validation.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { loginSchema } from "../../../models/userModels.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { getUserByEmail } from "../../../services/users.mjs";
import { comparePassword } from "../../../utils/bcrypt.mjs";
import { signToken } from "../../../utils/jwt.mjs";
import createError from "http-errors";

export const handler = middy(async (event) => {
  const { email, password } = event.body;

  const user = await getUserByEmail(email);

  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw createError(401, "Invalid email or password");
  }

  const token = signToken({
    userId: user.userId,
    username: user.username,
    role: user.role,
  });

  return sendResponse(200, {
    token,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
    },
  });
})
  .use(httpJsonBodyParser())
  .use(validateBody(loginSchema))
  .use(errorHandler());
