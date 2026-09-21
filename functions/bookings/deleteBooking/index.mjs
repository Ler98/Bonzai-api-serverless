import middy from "@middy/core";
import { sendResponse } from "../../../responses/index.mjs";
import { deleteBooking } from "../../../services/bookings.mjs";
import { authenticate } from "../../../middlewares/authentication.mjs";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";

export const handler = middy(async (event) => {
  const { id } = event.pathParameters || {};

  console.log("ID:", id);
  console.log("EVENT:", JSON.stringify(event, null, 2));

  await deleteBooking(event.user.userId, id);

  return sendResponse(200, {
    message: "Booking is gone :)",
  });
})
  .use(authenticate())
  .use(errorHandler());

// nej
