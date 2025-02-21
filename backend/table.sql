create table
    users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        adm_no VARCHAR(20) UNIQUE,
        teacher_id VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM ('teacher', 'student') NOT NULL
    );

insert into
    users (name, adm_no, teacher_id, password, role)
values
    ('kasongo', NULL, 'MA_17', '123456', 'teacher');

insert into
    users (name, adm_no, teacher_id, password, role)
values
    (
        'jeffrey',
        'TKNP/B/6030',
        NULL,
        'hashedpassword1',
        'student'
    ),
    (
        'Emily Ogolla',
        'TKNP/B/5775',
        NULL,
        'hashedpassword2',
        'student'
    ),
    (
        'Velma Odhiambo',
        'TKNP/B/6168',
        NULL,
        'hashedpassword3',
        'student'
    ),
    (
        'Purity Euniva',
        'TKNP/B/5952',
        NULL,
        'hashedpassword4',
        'student'
    ),
    (
        'Lenox Jobita',
        'TKNP/B/6040',
        NULL,
        'hashedpassword5',
        'student'
    );

    CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  student_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

INSERT INTO attendance (teacher_id, student_id, attendance_date, status)
VALUES (2, 3, CURDATE(), 'Present'),
       (2, 4, CURDATE(), 'Absent');
       (2, 5, CURDATE(), 'Present');

