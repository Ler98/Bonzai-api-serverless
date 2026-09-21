import Joi from "joi";

export const bookingSchema = Joi.object({
  user: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email must be a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  })
    .required()
    .messages({
      "any.required": "User information is required",
    }),

  checkIn: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),

  checkOut: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),

  guests: Joi.number().integer().min(1).strict().required(),

  rooms: Joi.array()
    .items(
      Joi.object({
        roomId: Joi.string().required(),
        type: Joi.string().valid("single", "double", "suite").required(),
      }),
    )
    .min(1)
    .required(),
});

export const updateBookingSchema = Joi.object({
  checkIn: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Check in must use the format YYYY-MM-DD",
      "any.required": "Check in is required",
    }),

  checkOut: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Check out must use the format YYYY-MM-DD",
      "any.required": "Check out is required",
    }),

  guests: Joi.number().integer().min(1).strict().required().messages({
    "number.base": "Guests must be entered as a number",
    "number.integer": "Guests must be a whole number",
    "number.min": "There must be at least one guest",
    "any.required": "Guests is required",
  }),

  rooms: Joi.array()
    .items(
      Joi.object({
        roomId: Joi.string().required(),

        type: Joi.string()
          .valid("single", "double", "suite")
          .required()
          .messages({
            "any.only": "Room type must be single, double or suite",
          }),
      }),
    )
    .min(1)
    .required(),
});
