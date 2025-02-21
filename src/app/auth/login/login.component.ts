import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  errorMessage: string = '';
  selectedRole: string = 'student';
  userId: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService) {}

  getPlaceholder(): string {
    return this.selectedRole === 'teacher' ? 'Teacher ID' : 'Admission Number';
  }

  get dynamicFieldName(): string {
    return this.selectedRole === 'teacher' ? 'teacherId' : 'admissionNumber';
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      const credentials =
        this.selectedRole === 'teacher'
          ? { teacher_id: this.userId, password: this.password, role: 'teacher' }
          : { adm_no: this.userId, password: this.password, role: 'student' };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          localStorage.setItem('token', response.token);
          this.router.navigate([
            this.selectedRole === 'teacher' ? '/home' : '/home',
          ]);
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorMessage = err.error.message || 'Login failed. Try again.';
        },
      });
    } else {
      console.log('Form is invalid');
    }
    form.resetForm({ role: this.selectedRole });
  }
}

