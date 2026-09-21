// Tagit hjälp med förklaring med AI - Lämnar kvar kommentar för grupp stöd
import crypto from "node:crypto";
import { hashPassword } from "./bcrypt.mjs";

export const createUser = async (body) => {
  // Unik id - används som PK: ANLEDNING. Bättre än email eftersom email kan bytas // Frågat AI
  const userId = crypto.randomUUID();

  // Hasha lösenordet INNAN det Sparas.
  const hashedPassword = await hashPassword(body.password);
  const now = new Date().toISOString();
  const email = body.email.toLowerCase(); // normalisera

  // Två items i samma tabell (single-table design):
  // 1. Profilrad (PK = USER#<id>) – används av AP5
  // 2. Email-uppslagsrad (PK = EMAIL#<email>) – används av AP4 (login)
  return [
    {
      PK: `USER#${userId}`,
      SK: `PROFILE`,
      userId,
      username: body.username,
      email,
      password: hashedPassword,
      role: "user", // sätts av API
      createdAt: now,
    },
    {
      PK: `EMAIL#${email}`,
      SK: `PROFILE`,
      userId,
      createdAt: now,
    },
  ];
};
