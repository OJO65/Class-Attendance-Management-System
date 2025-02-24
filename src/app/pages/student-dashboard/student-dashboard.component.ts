import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Chart, registerables} from 'chart.js';
import { Router } from '@angular/router';

Chart.register(...registerables);


interface StudentAttendanceRecord {
  student_name: string;
  adm_no: string
  attendance_date: string;
  status: string;
  teacher_name: string;
  lesson_name: string;
}

@Component({
  selector: 'app-student-dashboard',
  imports: [NgIf, NgClass, NgFor, DatePipe],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit, AfterViewInit {
  attendanceData: StudentAttendanceRecord[] = [];
  loadingAttendance: boolean = false;
  pieChart: any;
  attendanceGrade: string = '';
  gradeDescription: string = '';
  totalLessons: number = 0;
  totalPresent: number = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  ngAfterViewInit() {
    this.initializePieChart();
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
          console.log('Attendance data:', data);
          this.attendanceData = data;
          this.loadingAttendance = false;
          this.calculateGrade();
          this.updatePieChart();
        },
        error: (err) => {
          console.error('Error fetching attendance data:', err);
          this.loadingAttendance = false;
        },
      });
  }

  initializePieChart() {
    this.pieChart = new Chart('attendancePieChart', {
      type: 'pie',
      data: {
        labels: ['Present', 'Absent'],
        datasets: [
          {
            label: 'Attendance Status',
            data: [0, 0],
            backgroundColor: ['#10B981', '#EF4444'],
            hoverOffset: 4,
          },
        ],
      },
    });
  }

  calculateGrade() {
    this.totalLessons = this.attendanceData.length;
    this.totalPresent = this.attendanceData.filter(
      (record) => record.status === 'Present'
    ).length;

    const attendancePercentage =
      this.totalLessons > 0 ? (this.totalPresent / this.totalLessons) * 100 : 0;

    if (attendancePercentage >= 90) {
      this.attendanceGrade = 'A';
      this.gradeDescription = 'Excellent attendance!';
    } else if (attendancePercentage >= 80) {
      this.attendanceGrade = 'B';
      this.gradeDescription = 'Good attendance. Keep it up!';
    } else if (attendancePercentage >= 70) {
      this.attendanceGrade = 'C';
      this.gradeDescription = 'Average attendance. Try to improve.';
    } else if (attendancePercentage >= 60) {
      this.attendanceGrade = 'D';
      this.gradeDescription = 'Needs improvement. Aim for better attendance.';
    } else {
      this.attendanceGrade = 'F';
      this.gradeDescription = 'Poor attendance. Significant improvement needed.';
    }
  }

  updatePieChart() {
    if (this.pieChart) {
      const absentCount = this.totalLessons - this.totalPresent;

      this.pieChart.data.datasets[0].data = [this.totalPresent, absentCount];
      this.pieChart.update();
    }
  }

  goToTimetable() {
    this.router.navigate(['/timetable']);
  }
}
