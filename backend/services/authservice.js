require("dotenv").config();
const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Corrected .split usage

  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden: Invalid token" });

    console.log("Decoded Token:", decoded);

    res.locals.user = decoded; // ✅ Now `res.locals.user` will exist!
    next();
  });
}

module.exports = { authToken };
