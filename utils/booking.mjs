import { getRoomById } from "../services/rooms.mjs";
import { getBookingsByRoom } from "../services/bookings.mjs";
import createError from "http-errors";

// kapacitet för varje rumtyp
const capacity = {
  single: 1,
  double: 2,
  suite: 3,
};

// priser för varje rumtyp
const roomPrices = {
  single: 500,
  double: 1000,
  suite: 1500,
};

// kontrollera att datumen är giltigt formaterade enligt YYYY-MM-DD
const isValidDate = (date) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  return (
    !isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
};

// generera bokningsID
const generateBookingId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return Array.from(
    { length: 6 },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join("");
};

// skapa felmeddelanden om kraven ej uppfylls
export const validateBooking = async (booking, bookingId = null) => {
  const { rooms, guests, checkIn, checkOut } = booking;

  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    throw createError(400, "Dates must be valid and use the format YYYY-MM-DD");
  }

  if (checkIn >= checkOut) {
    throw createError(400, "Check-in date must be before check-out date");
  }

  let totalCapacity = 0;

  // kontrollera att rumsID:t är giltigt enligt rummen i databasen
  for (const room of rooms) {
    const roomIdRegex = /^[a-f0-9]{8}$/;

    if (!roomIdRegex.test(room.roomId)) {
      throw createError(400, `Invalid roomId: ${room.roomId}`);
    }

    const dbRoom = await getRoomById(room.roomId);

    if (!dbRoom) {
      throw createError(404, `Room ${room.roomId} does not exist`);
    }

    if (dbRoom.type !== room.type) {
      throw createError(
        400,
        `Room ${room.roomId} is a ${dbRoom.type}, not a ${room.type}`,
      );
    }

    // hämta rummet
    const roomBookings = await getBookingsByRoom(room.roomId);

    // kontrollera ifall rummet redan är bokat under de angivna datumen
    const isAlreadyBooked = roomBookings.some((roomBooking) => {
      // Ignorera den egna bokningen vid uppdatering
      if (bookingId && roomBooking.SK === `BOOKING#${bookingId}`) {
        return false;
      }

      return checkIn < roomBooking.checkOut && checkOut > roomBooking.checkIn;
    });

    if (isAlreadyBooked) {
      throw createError(
        400,
        `Room ${room.roomId} is not available for the dates selected`,
      );
    }

    totalCapacity += capacity[dbRoom.type];
  }

  // kontrollera att rumskapaciteten inte är högre än antalet gäster
  if (totalCapacity < guests) {
    throw createError(
      400,
      `The selected rooms can accommodate ${totalCapacity} guests, but ${guests} guests were requested`,
    );
  }

  // beräkna totalpriset
  const nights =
    (new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) /
    (1000 * 60 * 60 * 24);

  const totalPrice = rooms.reduce((total, room) => {
    return total + roomPrices[room.type] * nights;
  }, 0);

  return {
    totalPrice,
  };
};

// skapa bokning med användarID, bokningsID, PK och SK
export const createBooking = (booking, userId) => {
  const bookingId = generateBookingId();

  return {
    PK: `USER#${userId}`,
    SK: `BOOKING#${bookingId}`,
    ...booking,
    userId,
    bookingId,
    createdAt: new Date().toISOString(),
  };
};

// ta bort PK och SK från bokningen i response
export const formatBooking = (booking) => {
  return {
    userId: booking.userId,
    bookingId: booking.bookingId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    rooms: booking.rooms,
    totalPrice: booking.totalPrice,
    createdAt: booking.createdAt,
  };
};
