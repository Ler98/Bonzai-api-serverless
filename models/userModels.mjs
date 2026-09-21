// Registrering: Användaren skapar bara username, email och lösenord
// Rollen sätts av APIET // Jespers återvänd kod

import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Användarnamnet måste vara minst 3 bokstäver")
    .max(30, "Användarnamnet får vara max 30 bokstäver"),

  email: z.string().email("Ogiltigt email-format"),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken"),
});

export const loginSchema = z.object({
  email: z.string().email("Ogiltigt email-format"),
  password: z.string().min(1, "Lösenord krävs"),
});
