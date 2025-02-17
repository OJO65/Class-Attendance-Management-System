require("dotenv").config();
const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // ✅ Fixed here

  if (token == null) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) return res.sendStatus(403); // Invalid token

    res.locals.user = decoded; // Store user info in res.locals
    next();
  });
}

module.exports = { authToken };
