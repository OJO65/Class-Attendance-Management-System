const express = require("express");
const bcrypt = require("bcrypt");
const connection = require("../connection");
const router = express.Router();

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

module.exports = router;
