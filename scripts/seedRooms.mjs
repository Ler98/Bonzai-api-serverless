import crypto from "node:crypto";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../services/db.mjs";
import { rooms } from "../data/rooms.mjs";

const seedRooms = async () => {
  const items = rooms.map((room) => {
    const roomId = crypto.randomUUID().slice(0, 8);

    return {
      PK: `ROOM#${roomId}`,
      SK: "ROOM",
      ...room,
      roomId,
      createdAt: new Date().toISOString(),
    };
  });

  for (let i = 0; i < items.length; i += 20) {
    const batch = items.slice(i, i + 20);

    await db.send(
      new BatchWriteCommand({
        RequestItems: {
          "bonzai-table": batch.map((item) => ({
            PutRequest: {
              Item: item,
            },
          })),
        },
      }),
    );
    console.log(`Inserted ${batch.length} rooms`);
  }
  console.log(`Done! Seeded ${items.length} rooms`);
};

seedRooms();
