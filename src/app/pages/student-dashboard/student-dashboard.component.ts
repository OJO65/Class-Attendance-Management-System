import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';


interface StudentAttendanceRecord {
  attendance_date: string;
  status: string;
  teacher_name: string;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [NgIf, NgClass, NgFor, DatePipe, HttpClientModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  attendanceData: StudentAttendanceRecord[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  fetchAttendanceData() {
    this.loading = true;
    this.http.get<StudentAttendanceRecord[]>('http://localhost:8080/user/student-dashboard')
      .subscribe({
        next: (data) => {
          this.attendanceData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching student dashboard data:', err);
          this.loading = false;
        },
      });
  }
}
