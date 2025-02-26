import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  // This matches your Express setup - routes are mounted at /user
  private baseUrl = 'http://localhost:8080/user';

  constructor(private http: HttpClient) {}

  getStudentAttendance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/student-dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  markAttendance(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    return this.http.post(
      `${this.baseUrl}/attendance/mark`,
      {},
      { headers }
    );
  }
}