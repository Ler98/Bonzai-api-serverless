import middy from "@middy/core";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { getBookingsByUser } from "../../../services/bookings.mjs";
import { formatBooking } from "../../../utils/booking.mjs";

export const handler = middy(async (event) => {
  const { userId } = event.pathParameters;

  const bookings = await getBookingsByUser(userId);

  return sendResponse(200, {
    bookings: bookings.map(formatBooking),
  });
});
