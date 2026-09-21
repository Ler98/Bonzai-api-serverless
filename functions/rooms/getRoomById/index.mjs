import { sendResponse } from "../../../responses/index.mjs";
import { rooms } from "../../../data/rooms.mjs";
import { getRoomById } from "../../../services/rooms.mjs";

export const handler = async (event) => {
  const { id } = event.pathParameters;
  console.log("ID:", id);

  const room = await getRoomById(id);
  if (room) {
    return sendResponse(200, {
      success: true,
      room,
    });
  } else {
    return sendResponse(404, {
      success: false,
      message: "Inget rum hittades",
    });
  }
};
