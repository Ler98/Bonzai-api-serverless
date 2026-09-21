import { sendResponse } from "../../../responses/index.mjs";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { getRooms } from "../../../services/rooms.mjs";

export const handler = middy(async (event) => {
  const rooms = await getRooms();

  if (rooms.length > 0) {
    return sendResponse(200, {
      rooms,
    });
  }

  return sendResponse(404, { message: "No rooms were found" });
}).use(httpErrorHandler());
