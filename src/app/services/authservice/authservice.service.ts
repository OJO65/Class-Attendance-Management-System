import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthserviceService {
private apiUrl = 'http://localhost:5000/auth'
  constructor(private http: HttpClient) { }

  login(adm_no: string, password: string): Observable<any>{
    return this.http.post(`${this.apiUrl}/login`, {adm_no, password});
  }
}
