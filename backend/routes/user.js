const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../connection");
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;
var auth = require('../services/authservice');
var { checkRole } = require('../services/checkRole');


router.post("/register", async (req, res) => {
  try {
    const { name, adm_no, teacher_id, password, role } = req.body;

    // Validate input
    if (!name || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (role === "student" && !adm_no) {
      return res
        .status(400)
        .json({ message: "Admission number is required for students." });
    }
    if (role === "teacher" && !teacher_id) {
      return res
        .status(400)
        .json({ message: "Teacher ID is required for teachers." });
    }

    // Check if user already exists
    const checkQuery =
      role === "student"
        ? "SELECT adm_no FROM users WHERE adm_no = ?"
        : "SELECT teacher_id FROM users WHERE teacher_id = ?";

    const identifier = role === "student" ? adm_no : teacher_id;

    connection.query(checkQuery, [identifier], async (err, results) => {
      if (err)
        return res.status(500).json({ message: "Database error", error: err });

      if (results.length > 0) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user
      const insertQuery =
        "INSERT INTO users (name, adm_no, teacher_id, password, role) VALUES (?, ?, ?, ?, ?)";
      connection.query(
        insertQuery,
        [name, adm_no || null, teacher_id || null, hashedPassword, role],
        (err, result) => {
          if (err)
            return res
              .status(500)
              .json({ message: "Error inserting user", error: err });

          return res
            .status(201)
            .json({ message: "User registered successfully!" });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/login", (req, res) => {
    const { adm_no, password } = req.body;
  
    if (!adm_no || !password) {
      return res.status(400).json({ message: "Admission number and password are required." });
    }
  
    // Check if user exists
    const query = "SELECT * FROM users WHERE adm_no = ?";
    connection.query(query, [adm_no], (err, results) => {
      if (err) return res.status(500).json(err);
  
      if (results.length === 0) {
        return res.status(401).json({ message: "User not found." });
      }
  
      const user = results[0];
  
      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json(err);
  
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid password." });
        }
  
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, adm_no: user.adm_no, role: user.role },
          SECRET_KEY,
          { expiresIn: "1h" }
        );
  
        res.status(200).json({ message: "Login successful!", token, user });
      });
    });
  });

  router.get("/get", auth.authToken, (req, res) => {
    const { role } = res.locals; // Get the role from the JWT token
    let query = "";
    let identifier = "";
  
    // Check role and set the query accordingly
    if (role === "student") {
      identifier = res.locals.adm_no;  // adm_no from JWT token
      query = "SELECT * FROM users WHERE adm_no = ?";
    } else if (role === "teacher") {
      identifier = res.locals.teacher_id;  // teacher_id from JWT token
      query = "SELECT * FROM users WHERE teacher_id = ?";
    } else {
      return res.status(403).json({ message: "Unauthorized access." });
    }
  
    // Execute the query based on role
    connection.query(query, [identifier], (err, results) => {
      if (err) return res.status(500).json({ message: "Error fetching user data", error: err });
  
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(results[0]);
    });
  });
  
  


module.exports = router;
