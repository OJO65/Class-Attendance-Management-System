const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../connection");
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET;
var auth = require("../services/authservice");
var { checkRole } = require("../services/checkRole");

//REGISTER API
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

//LOGIN API
router.post("/login", (req, res) => {
  const { adm_no, password, teacher_id } = req.body;

  if ((!adm_no && !teacher_id) || !password) {
    return res.status(400).json({
      message: "Admission number or teacher_id and password are required.",
    });
  }

  let query, identifier;
  if (adm_no) {
    query = "SELECT * FROM users WHERE adm_no=?";
    identifier = adm_no;
  } else if (teacher_id) {
    query = "SELECT * FROM users WHERE teacher_id=?";
    identifier = teacher_id;
  } else {
    return res.status(400).json({ message: "Invalid request format." });
  }

  // Check if user exists
  connection.query(query, [identifier], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });

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
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
        expiresIn: "1h",
      });

      res.status(200).json({ message: "Login successful!", token, user });
    });
  });
});

//USER API
router.get("/get", auth.authToken, (req, res) => {
  const { role } = res.locals.user;

  let query;
  if (role === "teacher") {
    query = "SELECT id, name, adm_no FROM USERS WHERE role = 'student'";
  } else if (role === "student") {
    query = "SELECT id, name, teacher_id FROM USERS WHERE role = 'teacher'";
  } else {
    return res.status(403).json({ message: "unauthorized role access" });
  }

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    return res.status(200).json(results);
  });
});

//TEACHER_DASHBOARD API
router.get(
  "/teacher-dashboard",
  auth.authToken,
  checkRole("teacher"),
  (req, res) => {
    const teacherId = res.locals.user.id;

    const query = `
    SELECT s.id, s.name, s.adm_no, a.attendance_date, a.status
    FROM attendance a
    JOIN users s ON a.student_id = s.id
    WHERE a.teacher_id = ?
    ORDER BY a.attendance_date DESC;
  `;

    connection.query(query, [teacherId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.status(200).json(results);
    });
  }
);

//STUDENT_DASHBOARD API
router.get(
  "/student-dashboard",
  auth.authToken,
  checkRole("student"),
  (req, res) => {
    const studentId = res.locals.user.id;

    const query = `
    SELECT a.attendance_date, a.status, t.name AS teacher_name
    FROM attendance a
    JOIN users t ON a.teacher_id = t.id
    WHERE a.student_id = ?
    ORDER BY a.attendance_date DESC;
  `;

    connection.query(query, [studentId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.status(200).json(results);
    });
  }
);

//CHANGE PASSWORD API
router.post("/change-password", auth.authToken, async (req, res) => {
  const userId = res.locals.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both old and new passwords are required." });
  }

  const getUserQuery = "SELECT password FROM users WHERE id = ?";
  connection.query(getUserQuery, [userId], async (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = "UPDATE users SET password = ? WHERE id = ?";

    connection.query(updateQuery, [hashedNewPassword, userId], (err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error updating password", error: err });

      res.status(200).json({ message: "Password changed successfully." });
    });
  });
});

module.exports = router;
