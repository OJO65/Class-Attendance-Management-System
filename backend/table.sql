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
    users (name, teacher_id, password, role)
values
    ('kasongo', 'MA_17', '123456', 'teacher');

insert into
    users (name, adm_no, password, role)
values
    (
        'jeffrey',
        'TKNP/B/6030',
        'hashedpassword1',
        'student'
    ),
    (
        'Emily Ogolla',
        'TKNP/B/5775',
        'hashedpassword2',
        'student'
    ),
    (
        'Velma Odhiambo',
        'TKNP/B/6168',
        'hashedpassword3',
        'student'
    ),
    (
        'Purity Euniva',
        'TKNP/B/5952',
        'hashedpassword4',
        'student'
    ),
    (
        'Lenox Jobita',
        'TKNP/B/6040',
        'hashedpassword5',
        'student'
    );