import { db } from "./db.mjs";

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

import createError from "http-errors";

// hämta rum
export const getRooms = async () => {
  try {
    const command = new ScanCommand({
      TableName: "bonzai-table",
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: {
        ":sk": "ROOM",
      },
    });

    const { Items } = await db.send(command);
    console.log("ROOMS FROM DB:", Items);

    return Items;
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};

// hämta rum baserat på ID
export const getRoomById = async (roomId) => {
  try {
    const command = new GetCommand({
      TableName: "bonzai-table",
      Key: {
        PK: `ROOM#${roomId}`,
        SK: "ROOM",
      },
    });
    console.log("KEY:", {
      PK: `ROOM#${roomId}`,
      SK: "ROOM",
    });
    const result = await db.send(command);
    return result.Item;
  } catch (error) {
    throw createError(500, error.message);
  }
};

// lägg in rum i databasen
export const addRoom = async (room) => {
  try {
    const command = new PutCommand({
      TableName: "bonzai-table",
      Item: room,
    });

    await db.send(command);

    return true;
  } catch (error) {
    console.error("ERROR:", error);
    throw createError(500, error.message);
  }
};
