import { db } from "./db.mjs";
import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import createError from "http-errors";

// skapa bokning och lägg in i databasen
export const addBooking = async (booking) => {
  try {
    // Huvudbokningen
    const command = new PutCommand({
      TableName: "bonzai-table",
      Item: booking,
    });

    await db.send(command);

    // Bokningsinformation för varje rum
    for (const room of booking.rooms) {
      const roomBooking = {
        PK: `ROOM#${room.roomId}`,
        SK: `BOOKING#${booking.bookingId}`,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        userId: booking.userId,
      };

      await db.send(
        new PutCommand({
          TableName: "bonzai-table",
          Item: roomBooking,
        }),
      );
    }

    return booking;
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};

// hämta en användares bokningar
export const getBookingsByUser = async (userId) => {
  try {
    const command = new QueryCommand({
      TableName: "bonzai-table",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "BOOKING#",
      },
    });

    const { Items } = await db.send(command);

    // returnera Items om det finns, annars en tom array
    return Items ?? [];
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};

// Hämtar rumsbokningar
export const getBookingsByRoom = async (roomId) => {
  // Hämtar bokningsinformation för ett specifikt rum från databasen
  try {
    const command = new QueryCommand({
      TableName: "bonzai-table",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)", //själva sökningen
      ExpressionAttributeValues: {
        //bestämmer vad pk och sk betyder
        ":pk": `ROOM#${roomId}`, //vilken "grupp" det letas i
        ":sk": "BOOKING#", //vilken typ av post inom gruppen
      },
    });
    const { Items } = await db.send(command);
    return Items ?? [];
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};

// radera en bokning baserat på bookingId :)
export const deleteBooking = async (userId, bookingId) => {
  try {
    // Hämta bokningen först
    const getCommand = new GetCommand({
      TableName: "bonzai-table",
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKING#${bookingId}`,
      },
    });

    const getResult = await db.send(getCommand);
    const booking = getResult.Item;

    // Kontrollera att bokningen finns
    if (!booking) {
      throw createError(404, "Booking was not found");
    }

    // Ta bort huvudbokningen
    const deleteCommand = new DeleteCommand({
      TableName: "bonzai-table",
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKING#${bookingId}`,
      },
    });

    await db.send(deleteCommand);

    // Ta bort bokningsinformationen för varje rum
    for (const room of booking.rooms) {
      const deleteRoomBooking = new DeleteCommand({
        TableName: "bonzai-table",
        Key: {
          PK: `ROOM#${room.roomId}`,
          SK: `BOOKING#${bookingId}`,
        },
      });

      await db.send(deleteRoomBooking);
    }

    return true;
  } catch (error) {
    console.error("ERROR:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError(500, error.message);
  }
};

// export const deleteBooking = async (userId, bookingId) => {
//   try {
//     const command = new DeleteCommand({
//       TableName: "bonzai-table",
//       Key: {
//         PK: `USER#${userId}`,
//         SK: `BOOKING#${bookingId}`,
//       },
//     });

//     await db.send(command);

//     return true;
//   } catch (error) {
//     console.error("ERROR:", error);
//     throw createError(500, error.message);
//   }
// };

export const updateBooking = async (userId, bookingId, updates) => {
  try {
    // Hämta den befintliga bokningen
    const getCommand = new GetCommand({
      TableName: "bonzai-table",
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKING#${bookingId}`,
      },
    });

    const getResult = await db.send(getCommand);
    const existingBooking = getResult.Item;

    if (!existingBooking) {
      throw createError(404, "Booking was not found");
    }

    // Kontrollera om något faktiskt har ändrats
    const existingRooms = existingBooking.rooms
      .map((room) => `${room.roomId}-${room.type}`)
      .sort();

    const updatedRooms = updates.rooms
      .map((room) => `${room.roomId}-${room.type}`)
      .sort();

    const hasChanges =
      existingBooking.checkIn !== updates.checkIn ||
      existingBooking.checkOut !== updates.checkOut ||
      existingBooking.guests !== updates.guests ||
      JSON.stringify(existingRooms) !== JSON.stringify(updatedRooms);

    if (!hasChanges) {
      throw createError(400, "No changes were made to the booking");
    }

    // Uppdatera själva bokningen
    const command = new UpdateCommand({
      TableName: "bonzai-table",
      Key: {
        PK: `USER#${userId}`,
        SK: `BOOKING#${bookingId}`,
      },
      UpdateExpression:
        "SET checkIn = :checkIn, checkOut = :checkOut, guests = :guests, rooms = :rooms, totalPrice = :totalPrice",
      ExpressionAttributeValues: {
        ":checkIn": updates.checkIn,
        ":checkOut": updates.checkOut,
        ":guests": updates.guests,
        ":rooms": updates.rooms,
        ":totalPrice": updates.totalPrice,
      },
      ReturnValues: "ALL_NEW",
    });

    const result = await db.send(command);

    // radera gammal room booking-info
    for (const room of existingBooking.rooms) {
      const deleteRoomBooking = new DeleteCommand({
        TableName: "bonzai-table",
        Key: {
          PK: `ROOM#${room.roomId}`,
          SK: `BOOKING#${bookingId}`,
        },
      });

      await db.send(deleteRoomBooking);
    }

    // Skapa ny room booking-info
    for (const room of updates.rooms) {
      const roomBooking = {
        PK: `ROOM#${room.roomId}`,
        SK: `BOOKING#${bookingId}`,
        checkIn: updates.checkIn,
        checkOut: updates.checkOut,
        userId,
      };

      const putRoomBooking = new PutCommand({
        TableName: "bonzai-table",
        Item: roomBooking,
      });

      await db.send(putRoomBooking);
    }

    return result.Attributes;
  } catch (error) {
    console.error("ERROR:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError(500, error.message);
  }
};

//Hämta bokning på id
export const getBookingById = async (bookingId) => {
  try {
    const command = new QueryCommand({
      TableName: "bonzai-table",
      IndexName: "BookingIdIndex",
      KeyConditionExpression: "bookingId = :bookingId",
      ExpressionAttributeValues: {
        ":bookingId": bookingId,
      },
    });

    const result = await db.send(command);

    return result.Items?.[0];
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};
// bookings
