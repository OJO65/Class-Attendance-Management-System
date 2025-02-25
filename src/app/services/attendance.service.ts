import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private baseUrl = 'http://localhost:8080/attendance';

  constructor(private http: HttpClient) {}

  getStudentAttendance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/student-dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  markAttendance(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    return this.http.post(
      `${this.baseUrl}/mark`,
      {},
      { headers }
    );
  }
}
