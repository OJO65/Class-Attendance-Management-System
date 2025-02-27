import { Component, OnInit } from '@angular/core';
import { NgIf, NgClass, NgFor, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportService, WeeklyReport, SchoolReport, StudentAttendance } from '../../services/report.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-report',
  imports: [NgIf, NgClass, NgFor, DatePipe, ReactiveFormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  userRole: string | null = null;
  dateRangeForm = new FormGroup({
    startDate: new FormControl(''),
    endDate: new FormControl('')
  });
  
  weeklyReport: WeeklyReport | null = null;
  schoolReport: SchoolReport | null = null;
  loading = false;
  errorMessage = '';
  
  // Charts
  studentChart: any;
  dailyTrendsChart: any;
  attendanceDistributionChart: any;
  
  // Student view data
  weeklyGrade = '';
  weeklyGradeDescription = '';

  constructor(
    public reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.reportService.getUserRole();
    
    // Set default date range to current week
    const { startDate, endDate } = this.reportService.getCurrentWeekDates();
    this.dateRangeForm.setValue({ startDate, endDate });
    
    if (this.reportService.isAuthenticated()) {
      this.fetchReportData();
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  // In weekly-report.component.ts
fetchReportData(): void {
  this.loading = true;
  this.errorMessage = '';
  
  // Re-check user role - this helps if it wasn't available during initialization
  this.userRole = this.reportService.getUserRole();
  
  const { startDate, endDate } = this.dateRangeForm.value;
  
  if (!startDate || !endDate) {
    const dates = this.reportService.getCurrentWeekDates();
    this.dateRangeForm.setValue({ startDate: dates.startDate, endDate: dates.endDate });
  }
  
  const finalStartDate = startDate || this.reportService.getCurrentWeekDates().startDate;
  const finalEndDate = endDate || this.reportService.getCurrentWeekDates().endDate;
  
  console.log('Current user role:', this.userRole); // Debug logging
  
  // Fetch appropriate report based on user role
  if (this.userRole === 'student') {
    this.fetchStudentReport(finalStartDate, finalEndDate);
  } else if (this.userRole === 'teacher') {
    this.fetchTeacherReports(finalStartDate, finalEndDate);
  } else {
    this.loading = false;
    this.errorMessage = 'Unable to determine user role. Please try logging out and logging in again.';
    console.error('Invalid user role. Role detected:', this.userRole);
  }
}
  fetchStudentReport(startDate: string, endDate: string): void {
    this.reportService.getWeeklyReport(startDate, endDate).subscribe({
      next: (data) => {
        this.weeklyReport = data;
        this.loading = false;
        this.calculateWeeklyGrade();
        setTimeout(() => {
          this.initializeStudentChart();
        }, 100);
      },
      error: (error) => {
        console.error('Error fetching weekly report:', error);
        this.loading = false;
        this.errorMessage = error.status === 404 
          ? 'Could not connect to the report service. Please check if the server is running.'
          : `Error: ${error.message || 'Unknown error'}`;
      }
    });
  }

  fetchTeacherReports(startDate: string, endDate: string): void {
    this.reportService.getWeeklyReport(startDate, endDate).subscribe({
      next: (data) => {
        this.weeklyReport = data;
        
        // Also fetch school-wide report for teachers
        this.reportService.getSchoolReport(startDate, endDate).subscribe({
          next: (schoolData) => {
            this.schoolReport = schoolData;
            this.loading = false;
            setTimeout(() => {
              this.initializeTeacherCharts();
            }, 100);
          },
          error: (error) => {
            console.error('Error fetching school report:', error);
            this.loading = false;
            // Still initialize charts with available data
            setTimeout(() => {
              this.initializeTeacherCharts();
            }, 100);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching weekly report:', error);
        this.loading = false;
        this.errorMessage = error.status === 404 
          ? 'Could not connect to the report service. Please check if the server is running.'
          : `Error: ${error.message || 'Unknown error'}`;
      }
    });
  }

  getStudentData(): StudentAttendance | undefined {
    if (!this.weeklyReport || this.weeklyReport.student_attendance.length === 0) return undefined;
    
    // For a student, we're assuming the first entry is their own data
    return this.weeklyReport.student_attendance[0];
  }

  getStudentAttendanceRate(): number {
    const studentData = this.getStudentData();
    return studentData ? Math.round(studentData.attendance_rate * 10) / 10 : 0;
  }

  calculateWeeklyGrade(): void {
    const studentData = this.getStudentData();
    
    if (!studentData) {
      this.weeklyGrade = 'N/A';
      this.weeklyGradeDescription = 'No data available for this week.';
      return;
    }
    
    const attendanceRate = studentData.attendance_rate;
    
    if (attendanceRate >= 90) {
      this.weeklyGrade = 'A';
      this.weeklyGradeDescription = 'Excellent weekly attendance!';
    } else if (attendanceRate >= 80) {
      this.weeklyGrade = 'B';
      this.weeklyGradeDescription = 'Good weekly attendance. Keep it up!';
    } else if (attendanceRate >= 70) {
      this.weeklyGrade = 'C';
      this.weeklyGradeDescription = 'Average weekly attendance. Try to improve.';
    } else if (attendanceRate >= 60) {
      this.weeklyGrade = 'D';
      this.weeklyGradeDescription = 'Below average. Please improve attendance.';
    } else {
      this.weeklyGrade = 'F';
      this.weeklyGradeDescription = 'Poor weekly attendance. Improvement needed.';
    }
  }

  initializeStudentChart(): void {
    const studentData = this.getStudentData();
    if (!studentData) return;
    
    const canvas = document.getElementById('studentAttendanceChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    try {
      if (this.studentChart) {
        this.studentChart.destroy();
      }
      
      this.studentChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            label: 'Weekly Attendance',
            data: [studentData.days_present, studentData.days_absent],
            backgroundColor: ['#10B981', '#EF4444'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = studentData.days_present + studentData.days_absent;
                  const percentage = total > 0 ? Math.round((value as number / total) * 100) : 0;
                  return `${label}: ${value} days (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating student chart:', error);
    }
  }

  initializeTeacherCharts(): void {
    this.initializeDailyTrendsChart();
    this.initializeAttendanceDistributionChart();
  }

  initializeDailyTrendsChart(): void {
    const canvas = document.getElementById('dailyTrendsChart') as HTMLCanvasElement;
    if (!canvas || !this.schoolReport) return;
    
    try {
      if (this.dailyTrendsChart) {
        this.dailyTrendsChart.destroy();
      }
      
      const dailyData = this.schoolReport.daily_trends;
      
      this.dailyTrendsChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: dailyData.map(day => new Date(day.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Attendance Rate',
              data: dailyData.map(day => day.attendance_rate),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating daily trends chart:', error);
    }
  }

  initializeAttendanceDistributionChart(): void {
    const canvas = document.getElementById('attendanceDistributionChart') as HTMLCanvasElement;
    if (!canvas || !this.weeklyReport) return;
    
    try {
      if (this.attendanceDistributionChart) {
        this.attendanceDistributionChart.destroy();
      }
      
      // Group students by attendance rate ranges
      const attendanceRanges = [
        { label: '90-100%', count: 0, color: '#10B981' },
        { label: '80-89%', count: 0, color: '#3B82F6' },
        { label: '70-79%', count: 0, color: '#FBBF24' },
        { label: '60-69%', count: 0, color: '#F59E0B' },
        { label: 'Below 60%', count: 0, color: '#EF4444' }
      ];
      
      this.weeklyReport.student_attendance.forEach(student => {
        const rate = student.attendance_rate;
        if (rate >= 90) attendanceRanges[0].count++;
        else if (rate >= 80) attendanceRanges[1].count++;
        else if (rate >= 70) attendanceRanges[2].count++;
        else if (rate >= 60) attendanceRanges[3].count++;
        else attendanceRanges[4].count++;
      });
      
      this.attendanceDistributionChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: attendanceRanges.map(range => range.label),
          datasets: [{
            data: attendanceRanges.map(range => range.count),
            backgroundColor: attendanceRanges.map(range => range.color),
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = attendanceRanges.reduce((sum, range) => sum + range.count, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} students (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating attendance distribution chart:', error);
    }
  }

  getGradeColor(): string {
    switch (this.weeklyGrade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getAttendanceRateColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-blue-600';
    if (rate >= 70) return 'text-yellow-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  getProgressBarColor(): string {
    const rate = this.getStudentAttendanceRate();
    if (rate >= 90) return 'bg-green-600';
    if (rate >= 80) return 'bg-blue-600';
    if (rate >= 70) return 'bg-yellow-600';
    if (rate >= 60) return 'bg-orange-600';
    return 'bg-red-600';
  }

  getComparisonText(): string {
    if (!this.weeklyReport || !this.getStudentData()) return 'No Data';
    
    const studentRate = this.getStudentAttendanceRate();
    const classRate = this.weeklyReport.summary.overall_attendance_rate;
    
    const diff = studentRate - classRate;
    if (diff > 5) return 'Above Average';
    if (diff < -5) return 'Below Average';
    return 'Average';
  }
  
  getComparisonBadgeColor(): string {
    if (!this.weeklyReport || !this.getStudentData()) return 'bg-gray-500 text-white';
    
    const studentRate = this.getStudentAttendanceRate();
    const classRate = this.weeklyReport.summary.overall_attendance_rate;
    
    const diff = studentRate - classRate;
    if (diff > 5) return 'bg-green-600 text-white';
    if (diff < -5) return 'bg-red-600 text-white';
    return 'bg-blue-600 text-white';
  }
}
