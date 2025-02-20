import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'], // Fixed typo in `styleUrl` to `styleUrls`
})
export class RegisterComponent {
  private readonly _fb = inject(FormBuilder);

  constructor(private router: Router, private authService: AuthService) {}

  registerDetailsForm: FormGroup = this._fb.group({
    name: ['', Validators.required],
    adm_no: ['', Validators.required],
    password: ['', Validators.required],
    teacher_id: [''],
    role: [''],
  });

  submit() {
    if(this.registerDetailsForm.valid) {
      const userData = this.registerDetailsForm.value;
      if(userData.role === 'student') delete userData.teacher_id;
      if(userData.role === 'teacher') delete userData.adm_no;

      this.authService.register(userData).subscribe({
        next: (res) => {
          console.log('Registration successful:', res);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration failed:', err);
          alert(err.error.message || 'Registration failed.');
        },
      })
    } else {
      this.markFormControlsAsTouched();
    }
  }

  fieldIsInvalid(control: string) {
    const field = this.registerDetailsForm.get(control);
    return field?.invalid && field?.touched;
  }

  private markFormControlsAsTouched() {
    Object.values(this.registerDetailsForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
}
