import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';

import { Router } from '@angular/router';


interface StudentAttendanceRecord {
  attendance_date: string;
  status: string;
  teacher_name: string;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [NgIf, NgClass, NgFor, DatePipe],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  attendanceData: StudentAttendanceRecord[] = [];
  loadingAttendance: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  fetchAttendanceData() {
    this.loadingAttendance = true;
    this.http
      .get<StudentAttendanceRecord[]>(
        'http://localhost:8080/user/student-dashboard',
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      .subscribe({
        next: (data) => {
          this.attendanceData = data;
          this.loadingAttendance = false;
        },
        error: (err) => {
          console.error('Error fetching attendance data:', err);
          this.loadingAttendance = false;
        },
      });
  }

  goToTimetable() {
    this.router.navigate(['/timetable']);
  }
}
