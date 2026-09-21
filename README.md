# Bonzai-api-serverless

Det här projektet är ett grupparbete där vi har utvecklat ett REST API för hotellbokningar. API:et hanterar bland annat användare, rum och bokningar.
Projektet är byggt i ett annat repo. kopierat hit.

Projektet är byggt med AWS Lambda, API Gateway, DynamoDB, Serverless Framework och Node.js.

## Funktioner

- Hantera användare och inloggning
- Hämta rum och lediga rum
- Skapa, hämta, uppdatera och radera bokningar
- Kontrollera rumstillgänglighet utifrån datum

## Tekniker

- JavaScript
- Node.js
- AWS Lambda
- API Gateway
- DynamoDB
- Serverless Framework
- Git & GitHub

## Base URL

```
https://5snpd3to2a.execute-api.eu-north-1.amazonaws.com/auth/register
```

Alla endpoints nedan är relativa till denna URL.

### Autentisering

Skyddade endpoints kräver en JWT i `Authorization`-headern:

```
Authorization: Bearer <token>
```

Token erhålls genom att logga in via `POST /auth/login`. Token är giltig i 2 timmar.

## Endpoints

### POST /auth/register

Registrerar en ny användare.

**Kräver authentication:** Nej

**Request body:**

| Fält     | Typ    | Beskrivning          |
| -------- | ------ | -------------------- |
| username | string | 3–30 tecken          |
| email    | string | Giltigt email-format |
| password | string | Minst 6 tecken       |

**Exempel:**

```json
{
  "username": "anna",
  "email": "anna@example.com",
  "password": "mySecretPassword"
}
```

**Response 201:**

```json
{
  "message": "User registered successfully"
}
```

**Fel:**

| Status | Meddelande                                  | Orsak              |
| ------ | ------------------------------------------- | ------------------ |
| 400    | Användarnamnet måste vara minst 3 bokstäver | För kort username  |
| 400    | Användarnamnet får vara max 30 bokstäver    | För långt username |
| 400    | Ogiltigt email-format                       | Fel email-format   |
| 400    | Lösenordet måste vara minst 6 tecken        | För kort lösenord  |
| 409    | Email is already registered                 | Email finns redan  |
| 500    | Internal Server Error                       | Oväntat serverfel  |

---

###

### POST /auth/login

Loggar in en registrerad användare och returnerar en JWT.

**Kräver authentication:** Nej

**Request body:**

```json
{
  "email": "anna@example.com",
  "password": "mySecretPassword"
}
```

**Response 200:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "3b12e4f5-...",
    "username": "anna",
    "email": "anna@example.com"
  }
}
```

**Fel:**

| Status | Meddelande                | Orsak                    |
| ------ | ------------------------- | ------------------------ |
| 400    | Ogiltigt email-format     | Fel email-format         |
| 400    | Lösenord krävs            | Tomt lösenord            |
| 401    | Invalid email or password | Fel email eller lösenord |
| 500    | Internal Server Error     | Oväntat serverfel        |

<!-- Övriga endpoints (rooms, bookings) dokumenteras när kod är helt klart "BÖRJA HÄR"  -->

---

### GET / room By Id

Hämtar ett specifikt rum på id

**Kräver authentication:** Nej

**Request body:** Nej

GET {{BASE_URL}}/rooms/{{ROOM_ID}}

**Kräver id i url**

URL: /rooms/{id}

---

### GET / Available Rooms

Hämtar lediga rum

**Kräver authentication:** Nej

**Request body:** Nej

GET {{BASE_URL}}/rooms/available?

**Kräver datum i url**

URL: /rooms/available?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD

---

### GET / Booking By Id

Hämtar specifik bokning på id

**Kräver authentication:** Nej

**Request body:** Nej

**Kräver bookingId i url**

URL: /bookings/{id}

---

### GET ROOMS

Hämtar alla rum

**Kräver authentication:** Nej

GET {{BASE_URL}}/rooms

Kopiera ett roomId från svaret (t.ex. a1b2c3d4). Sätt variabel ROOM_ID.

**Request body:** Nej

URL: /rooms

---

### POST BOOKING

Skapar bokning

**Kräver authentication:** Nej

**Request body:** Ja

```json
{
  "user": {
    "email": "test123@gmail.com"
  },
  "checkIn": "2022-01-01",
  "checkOut": "2022-02-24",
  "guests": 3,
  "rooms": [
    {
      "roomId": "e8481581",
      "type": "suite"
    }
  ]
}
```

Man behöver ange sin mail för att skapa en bokning, oavsett om man är inloggad eller gäst

POST {{BASE_URL}}/bookings

URL: /bookings

Header: Authorization: Bearer {{TOKEN}}
Body (JSON):

**Response 200:**

```json
{
  "user": { "email": "guest@example.com" },
  "checkIn": "2026-10-01",
  "checkOut": "2026-10-03",
  "guests": 1,
  "rooms": [{ "roomId": "{{ROOM_ID}}", "type": "single" }]
}
```

---

### GET BOOKINGS BY USER

Hämtar en användares alla bokningar

**Kräver authentication:** Nej

**Request body:** Nej

URL: /bookings/{id}

---

### DELETE BOOKING

Raderar en bokning

**Kräver authentication:** Ja

**Request body:** Nej

{{BASE_URL}}/bookings/{{BOOKING_ID}}
Header: Authorization: Bearer {{TOKEN}}

URL: /bookings{id}

---

### UPDATE BOOKING BY ID

Uppdaterar en bokning baserat på ID

**Kräver authentication:** Ja

**Request body:** Ja

```json
{
  "checkIn": "2025-01-01",
  "checkOut": "2025-02-24",
  "guests": 2,
  "rooms": [
    {
      "roomId": "e8481581",
      "type": "suite"
    }
  ]
}
```

{{BASE_URL}}/bookings/{{USER_ID}}/{{BOOKING_ID}}

URL: /bookings/{id}

Header: Authorization: Bearer {{TOKEN}}
Body (JSON):

---
