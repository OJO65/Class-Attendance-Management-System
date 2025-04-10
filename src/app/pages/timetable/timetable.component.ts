import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.css'
})
export class TimetableComponent implements OnInit {
  timetableData: any[][] = [];
  loadingTimetable = true;
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  timeSlots: { start: string; end: string }[] = [
    { start: '09:00:00', end: '10:00:00' },
    { start: '10:00:00', end: '11:00:00' },
    { start: '11:15:00', end: '12:15:00' },
    { start: '12:15:00', end: '13:15:00' },
    { start: '14:00:00', end: '15:00:00' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTimetableData();
  }

  fetchTimetableData() {
    this.loadingTimetable = true;
    this.http
      .get<any[]>('http://localhost:8080/user/timetable', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .subscribe({
        next: (data) => {
          this.timetableData = this.formatTimetable(data);
          this.loadingTimetable = false;
        },
        error: (error) => {
          console.error('Error fetching timetable data:', error);
          this.loadingTimetable = false;
        },
      });
  }

  formatTimetable(data: any[]): any[][] {
    const formatted: any[][] = Array.from({ length: this.days.length }, () =>
      Array(this.timeSlots.length).fill('Free')
    );
  
    data.forEach((lesson) => {
      const dayIndex = this.days.findIndex((d) => d === lesson.day);
  
      this.timeSlots.forEach((slot, slotIndex) => {
        // Check if lesson overlaps this time slot
        if (
          lesson.start_time < slot.end &&
          lesson.end_time > slot.start
        ) {
          formatted[dayIndex][slotIndex] = lesson.unit_name;
        }
      });
    });
  
    return formatted;
  }
  
}