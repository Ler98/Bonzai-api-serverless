// Spara kommentar lättnad för grupp
import { db } from "./db.mjs";
import {
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import createError from "http-errors";
import crypto from "node:crypto";

const TABLE = "bonzai-table";

/**
 * Lägger till en ny användare.
 * TransactWriteItems säkerställer att:
 *   1. Email inte redan finns (ConditionExpression)
 *   2. Både profilrad och email-rad skrivs atomiskt
 * Om något går fel rullas allt tillbaka.
 */
export const addUser = async (items) => {
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: items.map((item) => ({
          Put: {
            TableName: TABLE,
            Item: item,
            // Om email-raden redan finns --> avbryt hela transaktionen.
            ...(item.PK.startsWith("EMAIL#") && {
              ConditionExpression: "attribute_not_exists(PK)",
            }),
          },
        })),
      }),
    );
    return true;
  } catch (error) {
    console.error("ERROR addUser:", error);

    if (error.name === "TransactionCanceledException") {
      throw createError(409, "Email is already registered");
    }
    throw createError(500, error.message);
  }
};

/**
 * AP4 – Hitta användare via email (används vid login).
 */
export const getUserByEmail = async (email) => {
  try {
    // Steg 1: slå upp userId via email-raden.
    const emailLookup = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: `EMAIL#${email.toLowerCase()}`,
          SK: "PROFILE",
        },
      }),
    );

    if (!emailLookup.Item) return null;

    // Steg 2: hämta själva profilen (med hashat lösenord).
    const profile = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: `USER#${emailLookup.Item.userId}`,
          SK: "PROFILE",
        },
      }),
    );

    return profile.Item || null;
  } catch (error) {
    console.error("ERROR getUserByEmail:", error);
    throw createError(500, error.message);
  }
};

/**
 * AP5 – Hämta profil via userId (används av skyddade endpoints).
 */
export const getUserById = async (userId) => {
  try {
    const { Item } = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
        },
      }),
    );
    return Item || null;
  } catch (error) {
    console.error("ERROR getUserById:", error);
    throw createError(500, error.message);
  }
};

// skapar en användare via mail, när man genomför en bokning utan att vara inloggad
export const createBookingUser = async (email) => {
  try {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const normalizedEmail = email.toLowerCase();

    const profile = {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      userId,
      email: normalizedEmail,
      role: "user",
      createdAt: now,
    };

    const emailLookup = {
      PK: `EMAIL#${normalizedEmail}`,
      SK: "PROFILE",
      userId,
      createdAt: now,
    };

    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: profile,
      }),
    );

    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: emailLookup,
      }),
    );

    return userId;
  } catch (error) {
    console.error("ERROR createBookingUser:", error);
    throw createError(500, error.message);
  }
};
