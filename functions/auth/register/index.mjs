// Jespers kod återskap
import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { validateBody } from "../../../middlewares/validation.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { registerSchema } from "../../../models/userModels.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { addUser } from "../../../services/users.mjs";
import { createUser } from "../../../utils/user.mjs";

export const handler = middy(async (event) => {
  // evnt.body är redan parsad och validerad av middlewares
  const items = await createUser(event.body);
  await addUser(items);

  return sendResponse(201, {
    message: "Fuck YES ! User registered successfully",
  });
})
  .use(httpJsonBodyParser())
  .use(validateBody(registerSchema))
  .use(errorHandler());
