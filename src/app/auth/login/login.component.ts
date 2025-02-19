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

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      const { admissionNumber, password } = form.value;
      const credentials = {
        adm_no: admissionNumber,  // Match backend field
        password: password
      };
  
      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          localStorage.setItem('token', response.token);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorMessage = err.error.message || 'Login failed. Try again.';
        },
      });
    } else {
      console.log('Form is invalid');
    }
    form.reset();
  }
  
}
