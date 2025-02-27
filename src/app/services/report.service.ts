import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';


export interface WeeklyReportPeriod {
  start_date: string;
  end_date: string;
}

export interface WeeklySummary {
  total_students: number;
  perfect_attendance_count: number;
  perfect_attendance_percentage: number;
  absent_one_or_more_days: number;
  overall_attendance_rate: number;
}

export interface StudentAttendance {
  student_id: number;
  student_name: string;
  adm_no: string;
  days_present: number;
  days_absent: number;
  attendance_rate: number;
}

export interface WeeklyReport {
  period: WeeklyReportPeriod;
  summary: WeeklySummary;
  student_attendance: StudentAttendance[];
}

export interface DailyTrend {
  date: string;
  present_count: number;
  absent_count: number;
  attendance_rate: number;
}


export interface TeacherSummary {
  teacher_id: number;
  teacher_name: string;
  student_count: number;
  attendance_rate: number;
}

export interface SchoolSummary {
  total_teachers: number;
  total_students: number;
  overall_attendance_rate: number;
}

export interface SchoolReport {
  report_period: WeeklyReportPeriod;
  school_summary: SchoolSummary;
  daily_trends: DailyTrend[];
  teacher_summaries: TeacherSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:8080/user';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUserRole(): string | null {
    // First try the direct 'role' item
    const directRole = localStorage.getItem('role');
    if (directRole) {
      console.log('Role found directly in localStorage:', directRole);
      return directRole;
    }
    
    try {
      // Try to get from JWT token
      const token = localStorage.getItem('token');
      if (token) {
        // Parse JWT payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.role) {
          console.log('Role from token:', payload.role);
          return payload.role;
        }
      }
      
      // Try to get from user object (fallback)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role) {
          console.log('Role from user object:', user.role);
          return user.role;
        }
      }
      
      console.log('No role information found in storage');
      return null;
    } catch (e) {
      console.error('Error getting user role:', e);
      return null;
    }
  }

  getWeeklyReport(startDate?: string, endDate?: string): Observable<WeeklyReport> {
    let url = `${this.apiUrl}/weekly-report`;
    
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    return this.http.get<WeeklyReport>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching weekly report:', error);
          return throwError(() => error);
        })
      );
  }

  getSchoolReport(startDate?: string, endDate?: string): Observable<SchoolReport> {
    let url = `${this.apiUrl}/weekly-report/all`;
    
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    return this.http.get<SchoolReport>(url, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Error fetching school report:', error);
          return throwError(() => error);
        })
      );
  }

  // Helper method to get the current week's date range
  getCurrentWeekDates(): { startDate: string, endDate: string } {
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
    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];
    
    return { startDate, endDate };
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}