import { AfterViewInit, Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { NgIf, NgForOf, NgClass, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);


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
export class TeacherDashboardComponent implements OnInit, AfterViewInit {
  attendanceData: TeacherAttendanceRecord[] = [];
  loading: boolean = false;
  pieChart: any;
  barChart: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  fetchAttendanceData() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loading = true;
    this.http
      .get<TeacherAttendanceRecord[]>(
        'http://localhost:8080/user/teacher-dashboard',
        { headers }
      )
      .subscribe({
        next: (data) => {
          this.attendanceData = data;
          this.loading = false;
          this.updateCharts();
        },
        error: (err) => {
          console.error('Error fetching teacher dashboard data:', err);
          this.loading = false;
        },
      });
  }

  initializeCharts() {
    this.pieChart = new Chart('pieChart', {
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

    this.barChart = new Chart('barChart', {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Present',
            data: [],
            backgroundColor: '#10B981',
          },
          {
            label: 'Absent',
            data: [],
            backgroundColor: '#EF4444',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  updateCharts() {
    if (this.pieChart && this.barChart) {
      const presentCount = this.attendanceData.filter(
        (record) => record.status === 'Present'
      ).length;
      const absentCount = this.attendanceData.filter(
        (record) => record.status === 'Absent'
      ).length;

      this.pieChart.data.datasets[0].data = [presentCount, absentCount];
      this.pieChart.update();

      const studentNames = [...new Set(this.attendanceData.map((r) => r.name))];
      const presentData = studentNames.map(
        (name) =>
          this.attendanceData.filter(
            (r) => r.name === name && r.status === 'Present'
          ).length
      );
      const absentData = studentNames.map(
        (name) =>
          this.attendanceData.filter(
            (r) => r.name === name && r.status === 'Absent'
          ).length
      );

      this.barChart.data.labels = studentNames;
      this.barChart.data.datasets[0].data = presentData;
      this.barChart.data.datasets[1].data = absentData;
      this.barChart.update();
    }
  }
}
