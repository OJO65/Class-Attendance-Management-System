import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgIf, NgForOf, NgClass, DatePipe } from '@angular/common';


interface TeacherAttendanceRecord {
  id: number;
  name: string;
  adm_no: string;
  attendance_date: string;
  status: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, DatePipe, HttpClientModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css'],
})
export class TeacherDashboardComponent implements OnInit {
  attendanceData: TeacherAttendanceRecord[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  fetchAttendanceData() {
    this.loading = true;
    this.http.get<TeacherAttendanceRecord[]>('http://localhost:8080/user/teacher-dashboard')
      .subscribe({
        next: (data) => {
          this.attendanceData = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching teacher dashboard data:', err);
          this.loading = false;
        },
      });
  }
}
