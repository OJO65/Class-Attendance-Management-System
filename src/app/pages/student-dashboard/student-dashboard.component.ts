import { Component, OnInit, AfterViewInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Chart, registerables} from 'chart.js';
import { Router } from '@angular/router';
import { AttendanceService } from '../../services/attendance.service';

Chart.register(...registerables);


interface StudentAttendanceRecord {
  student_name: string;
  adm_no: string
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
export class StudentDashboardComponent implements OnInit, AfterViewInit {
  attendanceData: StudentAttendanceRecord[] = [];
  loadingAttendance = false;
  pieChart: any;
  attendanceGrade = '';
  gradeDescription = '';
  totalLessons = 0;
  totalPresent = 0;
  errorMessage = '';

  constructor(
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchAttendanceData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializePieChart();
    }, 100);
  }

  fetchAttendanceData() {
    this.loadingAttendance = true;
    this.errorMessage = '';
    
    this.attendanceService.getStudentAttendance().subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          this.attendanceData = response;
        } else if (response && response.attendance && Array.isArray(response.attendance)) {
          this.attendanceData = response.attendance;
        } else {
          this.attendanceData = [];
          this.errorMessage = 'Unexpected data format from server';
          console.error('Unexpected response format:', response);
        }
        
        this.loadingAttendance = false;
        this.calculateGrade();
        this.updatePieChart();
      },
      error: (error) => {
        console.error('Error fetching attendance data:', error);
        this.loadingAttendance = false;
        this.errorMessage = error.status === 404 
          ? 'Could not connect to attendance service. Please check if the server is running.'
          : `Error: ${error.message || 'Unknown error'}`;
      },
    });
  }

  markAttendance() {
    this.attendanceService.markAttendance().subscribe({
      next: (response) => {
        console.log('Attendance marked:', response);
        this.fetchAttendanceData(); // Refresh data after marking attendance
      },
      error: (err) => {
        console.error('Error marking attendance:', err);
        this.errorMessage = err.error?.message || 'Failed to mark attendance';
      },
    });
  }

  initializePieChart() {
    // Get the canvas element
    const canvas = document.getElementById('attendancePieChart') as HTMLCanvasElement;
    
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }
    
    try {
      // Create the new chart
      this.pieChart = new Chart(canvas, {
        type: 'pie',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            label: 'Attendance Status',
            data: [0, 0], // Initialize with zeros, will update later
            backgroundColor: ['#10B981', '#EF4444'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Update with actual data if available
      if (this.totalLessons > 0) {
        this.updatePieChart();
      }
    } catch (error) {
      console.error('Error creating chart:', error);
    }
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
      const presentCount = this.totalPresent;
      const absentCount = this.totalLessons - this.totalPresent;
      
      this.pieChart.data.datasets[0].data = [presentCount, absentCount];
      this.pieChart.update();
    }
  }
  goToTimetable() {
    this.router.navigate(['/timetable']);
  }
}