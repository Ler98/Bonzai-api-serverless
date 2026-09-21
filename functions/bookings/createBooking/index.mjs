import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import createError from "http-errors";
import { errorHandler } from "../../../middlewares/errorHandler.mjs";
import { sendResponse } from "../../../responses/index.mjs";
import { addBooking } from "../../../services/bookings.mjs";
import { bookingSchema } from "../../../models/bookingModels.mjs";
import { getUserByEmail, createBookingUser } from "../../../services/users.mjs";
import { optionalAuthenticate } from "../../../middlewares/authentication.mjs";
import {
  createBooking,
  formatBooking,
  validateBooking,
} from "../../../utils/booking.mjs";

export const handler = middy(async (event) => {
  // applicera bokningsmodellen på bokningen som ska skapas
  const { error, value } = bookingSchema.validate(event.body, {
    abortEarly: false,
    convert: false,
  });

  if (error) {
    const errorField = error.details[0].path[0];

    if (errorField === "guests") {
      throw createError(
        400,
        "Guests must be entered as a number, not a string",
      );
    }

    if (errorField === "checkIn" || errorField === "checkOut") {
      throw createError(
        400,
        "Check in and check out needs to be written in the format YYYY-MM-DD",
      );
    }

    if (errorField === "rooms") {
      throw createError(400, "Room type must be single, double or suite");
    }

    throw createError(400, error.details[0].message);
  }

  const { user, ...bookingData } = value;

  let userId;

  if (event.user) {
    // inloggad och jwt används
    userId = event.user.userId;
  } else {
    // utloggad och mail används
    const existingUser = await getUserByEmail(user.email);

    if (existingUser) {
      userId = existingUser.userId;
    } else {
      userId = await createBookingUser(user.email);
    }
  }

  const booking = createBooking(bookingData, userId);

  // beräkna totalpriset
  const { totalPrice } = await validateBooking(booking);

  booking.totalPrice = totalPrice;

  await addBooking(booking);

  return sendResponse(201, {
    message: "Booking added to database",
    booking: formatBooking(booking),
  });
})
  .use(httpJsonBodyParser())
  .use(optionalAuthenticate())
  .use(errorHandler());
