import { sendResponse } from "../../../responses/index.mjs";
import { getBookingById } from "../../../services/bookings.mjs";

export const handler = async (event) => {
  const { id } = event.pathParameters;

  const booking = await getBookingById(id);
  if (booking) {
    return sendResponse(200, {
      success: true,
      message: "en bokning hittades",
      booking,
    });
  } else {
    return sendResponse(404, {
      success: false,
      message: "Ingen bokning hittades",
    });
  }
};
