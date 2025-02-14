import { NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthserviceService } from '../../services/authservice/authservice.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  authService = inject(AuthserviceService);
  router = inject(Router);

  onSubmit(form: NgForm) {
    if (form.valid) {
      console.log('Logging in with:', form.value);
      this.authService.login(form.value.adm_no, form.value.password).subscribe({
        next: (response) => {
          console.log('Login successful:', response)
          //redirect to home
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Login failed:', err);
        }
      });
    } else {
      console.log('Form is invalid');
    }

    form.reset();
  }
}
