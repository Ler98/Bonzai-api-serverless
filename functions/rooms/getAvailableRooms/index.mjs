import { sendResponse } from "../../../responses/index.mjs";
import { getRooms } from "../../../services/rooms.mjs";
import { getBookingsByRoom } from "../../../services/bookings.mjs";
// import { rooms } from "../../../data/rooms.mjs";

export const handler = async (event) => {
  const { checkIn, checkOut } = event.queryStringParameters || {}; //hämtar checkin, checkout från insomnia
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/; //format för hur datumet ska skrivas i urlen

  if (!checkIn || !checkOut) {
    return sendResponse(400, {
      //400 - användaren skickade något fel
      success: false,
      message: "Vänligen fyll i datum för checkIn och checkOut",
    });
  }
  if (!dateFormat.test(checkIn) || !dateFormat.test(checkOut)) {
    // .test() kontrollerar om datumet matchar vårt datumformat.
    return sendResponse(400, {
      success: false,
      message: "Datumet måste anges i formatet YYYY-MM-DD",
    });
  }
  if (checkIn >= checkOut) {
    return sendResponse(400, {
      success: false,
      message:
        "Ange ett checkOut-datum som inte har passerat datumet för checkIn",
    });
  }

  const rooms = await getRooms(); //hämtar alla rum och lägger dem i en ny variabel

  const bookedRooms = [];

  for (const room of rooms) {
    //för varje rum i rums
    const roomBookings = await getBookingsByRoom(room.roomId); //DynamoDB, ge mig alla rumsbokningar som hör till det här rummet.

    for (const booking of roomBookings) {
      if (checkIn < booking.checkOut && checkOut > booking.checkIn) {
        if (!bookedRooms.includes(room)) {
          //kollar om rummet redan finns i bookedRooms
          bookedRooms.push(room); //lägger in upptagna rum i arrayen
        }
      }
    }
  }
  const availableRooms = rooms.filter((room) => {
    return !bookedRooms.includes(room); //går igenom rooms och behåller de som inte finns i bookedRooms
  });

  return sendResponse(200, {
    success: true,
    message: "Tillgängliga rum hittades!",
    availableRooms,
  });
};
