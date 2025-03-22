const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../connection");
const router = express.Router();
const cron = require('node-cron');

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
    SELECT s.id, s.name AS student_name, s.adm_no, a.attendance_date, a.status, t.name AS teacher_name
    FROM attendance a
    JOIN users s ON a.student_id = s.id
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

//TIMETABLE API
router.get("/timetable", auth.authToken, checkRole("student"), (req, res) => {
  const query = `
    SELECT day, unit_name, start_time, end_time
    FROM timetable
    ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), start_time;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.status(200).json(results);
  });
});

// MARK ATTENDANCE API (Updated to use users table only)
router.post("/attendance/mark", auth.authToken, checkRole("student"), (req, res) => {
  const studentId = res.locals.user.id;

  // Get a teacher ID
  const teacherQuery = "SELECT id FROM users WHERE role = 'teacher' LIMIT 1";
  connection.query(teacherQuery, (err, teacherResult) => {
    if (err || teacherResult.length === 0) {
      return res.status(500).json({ message: "Teacher not found.", error: err });
    }

    // Change this line - use id instead of teacher_id
    const teacherId = teacherResult[0].id;
    const attendanceDate = new Date().toISOString().split("T")[0];

    const checkQuery = `SELECT * FROM attendance WHERE student_id = ? AND attendance_date = ?`;
    connection.query(checkQuery, [studentId, attendanceDate], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });

      if (results.length > 0) {
        return res.status(400).json({ message: "Attendance already marked for today." });
      }

      const insertQuery = `INSERT INTO attendance (student_id, teacher_id, attendance_date, status) VALUES (?, ?, ?, 'Present')`;
      connection.query(insertQuery, [studentId, teacherId, attendanceDate], (err) => {
        if (err) return res.status(500).json({ message: "Error marking attendance", error: err });

        res.status(200).json({ message: "Attendance marked as Present!" });
      });
    });
  });
});

// CRON JOB: Auto-mark absent at 11:59 PM (Updated to use users table only)
dailyCron = cron.schedule("59 23 * * *", () => {
  const attendanceDate = new Date().toISOString().split("T")[0];
  const absentQuery = `
    INSERT INTO attendance (student_id, teacher_id, attendance_date, status)
    SELECT s.id, t.id, ?, 'Absent'
    FROM users s
    CROSS JOIN (SELECT id FROM users WHERE role = 'teacher' LIMIT 1) t
    WHERE s.role = 'student'
    AND s.id NOT IN (
      SELECT student_id FROM attendance WHERE attendance_date = ?
    );
  `;
  connection.query(absentQuery, [attendanceDate, attendanceDate], (err) => {
    if (err) {
      console.error("Error auto-marking absent:", err);
    } else {
      console.log("Absent students marked successfully for:", attendanceDate);
    }
  });
});

dailyCron.start();

// GET STUDENT ATTENDANCE API
router.get("/attendance/student-dashboard", auth.authToken, checkRole("student"), (req, res) => {
  const studentId = res.locals.user.id;

  const attendanceQuery = `
    SELECT a.attendance_date, a.status, 
           s.name AS student_name,
           s.adm_no,
           t.name AS teacher_name
    FROM attendance a
    JOIN users s ON a.student_id = s.id
    JOIN users t ON a.teacher_id = t.id
    WHERE a.student_id = ?
    ORDER BY a.attendance_date DESC;
  `;

  connection.query(attendanceQuery, [studentId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving attendance records.", error: err });
    }
    // Return results directly instead of wrapping them in an object
    res.status(200).json(results);
  });
});


// WEEKLY REPORT API
router.get(
  "/weekly-report",
  auth.authToken,
  (req, res) => {
    const userId = res.locals.user.id;
    const userRole = res.locals.user.role; // Changed from res.locals.userRole
    
    // Get the start and end dates for the current week
    // Default to current week if not specified
    let { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      // Calculate current week (Monday to Sunday)
      const today = new Date();
      const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
      
      // Calculate the date of Monday (start of week)
      const mondayOffset = day === 0 ? -6 : 1 - day; // If today is Sunday, go back 6 days
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      
      // Calculate the date of Sunday (end of week)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      // Format dates as YYYY-MM-DD
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    }

    // Customize query based on user role
    let query;
    let queryParams;

    if (userRole === 'student') {
      // For students, only show their own data
      query = `
        SELECT 
          u.id AS student_id,
          u.name AS student_name,
          u.adm_no,
          (
            SELECT COUNT(*) 
            FROM attendance 
            WHERE student_id = u.id 
            AND attendance_date BETWEEN ? AND ?
            AND status = 'Present'
          ) AS days_present,
          (
            SELECT COUNT(*) 
            FROM attendance 
            WHERE student_id = u.id 
            AND attendance_date BETWEEN ? AND ?
            AND status = 'Absent'
          ) AS days_absent
        FROM 
          users u
        WHERE 
          u.id = ?
        LIMIT 1;
      `;
      queryParams = [startDate, endDate, startDate, endDate, userId];
    } else {
      // For teachers, show all students
      query = `
        SELECT 
          u.id AS student_id,
          u.name AS student_name,
          u.adm_no,
          (
            SELECT COUNT(*) 
            FROM attendance 
            WHERE student_id = u.id 
            AND attendance_date BETWEEN ? AND ?
            AND status = 'Present'
          ) AS days_present,
          (
            SELECT COUNT(*) 
            FROM attendance 
            WHERE student_id = u.id 
            AND attendance_date BETWEEN ? AND ?
            AND status = 'Absent'
          ) AS days_absent
        FROM 
          users u
        WHERE 
          u.role = 'student'
        ORDER BY 
          u.name;
      `;
      queryParams = [startDate, endDate, startDate, endDate];
    }
    
    connection.query(
      query, 
      queryParams,
      (err, studentResults) => {
        if (err) {
          return res.status(500).json({ 
            message: "Error generating weekly report", 
            error: err 
          });
        }
        
        // Calculate overall statistics
        const totalStudents = studentResults.length;
        const totalDays = 5; // Assuming 5 school days per week
        
        let perfectAttendance = 0;
        let absentOneOrMoreDays = 0;
        let totalAttendanceRate = 0;
        
        const studentAttendance = studentResults.map(student => {
          const daysPresent = student.days_present || 0;
          const daysAbsent = student.days_absent || 0;
          const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;
          
          if (daysPresent === totalDays) {
            perfectAttendance++;
          }
          
          if (daysAbsent > 0) {
            absentOneOrMoreDays++;
          }
          
          totalAttendanceRate += attendanceRate;
          
          return {
            student_id: student.student_id,
            student_name: student.student_name,
            adm_no: student.adm_no,
            days_present: daysPresent,
            days_absent: daysAbsent,
            attendance_rate: Math.round(attendanceRate * 10) / 10 // Round to 1 decimal place
          };
        });
        
        // Prepare the report
        const weeklyReport = {
          report_period: {
            start_date: startDate,
            end_date: endDate
          },
          summary: {
            total_students: totalStudents,
            perfect_attendance_count: perfectAttendance,
            perfect_attendance_percentage: totalStudents > 0 ? (perfectAttendance / totalStudents) * 100 : 0,
            absent_one_or_more_days: absentOneOrMoreDays,
            overall_attendance_rate: totalStudents > 0 ? Math.round((totalAttendanceRate / totalStudents) * 10) / 10 : 0
          },
          student_attendance: studentAttendance
        };
        
        res.status(200).json(weeklyReport);
      }
    );
  }
);

// To allow generation of reports for all students (available to teachers)
router.get(
  "/weekly-report/all",
  auth.authToken,
  checkRole("teacher"), // Using existing teacher role instead of creating admin
  (req, res) => {
    // Get the start and end dates for the current week
    let { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      // Calculate current week (Monday to Sunday)
      const today = new Date();
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      startDate = monday.toISOString().split('T')[0];
      endDate = sunday.toISOString().split('T')[0];
    }

    // Get overall school attendance stats and detailed attendance by class/teacher
    const query = `
      SELECT 
        t.id AS teacher_id,
        t.name AS teacher_name,
        COUNT(DISTINCT s.id) AS student_count,
        COUNT(DISTINCT CASE WHEN a.status = 'Present' THEN a.id END) AS present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'Absent' THEN a.id END) AS absent_count
      FROM 
        users t
      LEFT JOIN 
        attendance a ON t.id = a.teacher_id AND a.attendance_date BETWEEN ? AND ?
      LEFT JOIN 
        users s ON a.student_id = s.id AND s.role = 'student'
      WHERE 
        t.role = 'teacher'
      GROUP BY 
        t.id;
    `;
    
    connection.query(
      query, 
      [startDate, endDate],
      (err, teacherResults) => {
        if (err) {
          return res.status(500).json({ 
            message: "Error generating school-wide weekly report", 
            error: err 
          });
        }
        
        // Get the daily attendance trends
        const dailyTrendsQuery = `
          SELECT 
            a.attendance_date,
            COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
            COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_count
          FROM 
            attendance a
          WHERE 
            a.attendance_date BETWEEN ? AND ?
          GROUP BY 
            a.attendance_date
          ORDER BY 
            a.attendance_date;
        `;
        
        connection.query(
          dailyTrendsQuery,
          [startDate, endDate],
          (err, dailyResults) => {
            if (err) {
              return res.status(500).json({ 
                message: "Error generating daily attendance trends", 
                error: err 
              });
            }
            
            // Prepare the school-wide report
            const schoolReport = {
              report_period: {
                start_date: startDate,
                end_date: endDate
              },
              school_summary: {
                total_teachers: teacherResults.length,
                total_students: teacherResults.reduce((sum, teacher) => sum + (teacher.student_count || 0), 0),
                overall_attendance_rate: calculateAttendanceRate(
                  teacherResults.reduce((sum, teacher) => sum + (teacher.present_count || 0), 0),
                  teacherResults.reduce((sum, teacher) => sum + ((teacher.present_count || 0) + (teacher.absent_count || 0)), 0)
                )
              },
              daily_trends: dailyResults.map(day => ({
                date: day.attendance_date,
                present_count: day.present_count || 0,
                absent_count: day.absent_count || 0,
                attendance_rate: calculateAttendanceRate(day.present_count || 0, (day.present_count || 0) + (day.absent_count || 0))
              })),
              teacher_summaries: teacherResults.map(teacher => ({
                teacher_id: teacher.teacher_id,
                teacher_name: teacher.teacher_name,
                student_count: teacher.student_count || 0,
                attendance_rate: calculateAttendanceRate(teacher.present_count || 0, (teacher.present_count || 0) + (teacher.absent_count || 0))
              }))
            };
            
            res.status(200).json(schoolReport);
          }
        );
      }
    );
  }
);

// Helper function to calculate attendance rate
function calculateAttendanceRate(presentCount, totalCount) {
  if (totalCount === 0) return 0;
  return Math.round((presentCount / totalCount) * 1000) / 10; // Round to 1 decimal place
}

module.exports = router;
