import jwt from "jsonwebtoken";

export const signToken = (payload) => {
  return jwt.sign(payload, "bonzai", { expiresIn: "1h" });
};

export const verifyToken = (token) => {
  return jwt.verify(token, "bonzai");
};
