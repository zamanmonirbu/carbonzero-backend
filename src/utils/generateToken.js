const jwt = require("jsonwebtoken");
const { refreshTokenSecrete,accessTokenSecrete, accessTokenExpires, refreshTokenExpires } = require("../config");

const generateAccessToken = (id,email,role) => {
  return jwt.sign({ id,email,role },accessTokenSecrete , { expiresIn: accessTokenExpires });
};

const generateRefreshToken = (id,email,role) => {
  return jwt.sign({ id,email,role }, refreshTokenSecrete, { expiresIn: refreshTokenExpires });
};

module.exports = { generateAccessToken, generateRefreshToken };
