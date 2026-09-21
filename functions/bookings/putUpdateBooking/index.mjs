import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { updateBookingSchema } from "../../../models/bookingModels.mjs";
import createError from "http-errors";
import { authenticate } from "../../../middlewares/authentication.mjs";
import { validateBooking } from "../../../utils/booking.mjs";
import { updateBooking } from "../../../services/bookings.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { formatBooking } from "../../../utils/booking.mjs";

export const handler = middy(async (event) => {
  // hämta parametrar för bookingId
  const { id } = event.pathParameters;
  const userId = event.user.userId;

  // validera med bokningsschemat
  const { error, value } = updateBookingSchema.validate(event.body, {
    abortEarly: false,
    convert: false,
  });

  if (error) {
    const detail = error.details[0];

    if (detail.path[0] === "checkIn" || detail.path[0] === "checkOut") {
      throw createError(
        400,
        "Check in and check out dates must be written in the format YYYY-MM-DD",
      );
    }

    if (detail.path[0] === "guests") {
      throw createError(
        400,
        "Guests must be entered as a whole number and must be bigger than 0",
      );
    }

    if (detail.path[0] === "rooms" && detail.path[2] === "type") {
      throw createError(400, "Room type must be single, double or suite");
    }

    throw createError(400, detail.message);
  }

  // beräkna totalpris
  const { totalPrice } = await validateBooking(value, id);

  // uppdatera bokning
  const updatedBooking = await updateBooking(userId, id, {
    ...value,
    totalPrice,
  });

  if (!updatedBooking) {
    throw createError(404, "Booking was not found");
  }

  return sendResponse(200, {
    message: "Booking updated successfully",
    booking: formatBooking(updatedBooking),
  });
})
  .use(httpJsonBodyParser())
  .use(authenticate())
  .use(errorHandler());
