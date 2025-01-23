import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'], // Fixed typo in `styleUrl` to `styleUrls`
})
export class RegisterComponent {
  private readonly _fb = inject(FormBuilder);

  constructor(private router: Router) {}

  registerDetailsForm: FormGroup = this._fb.group({
    admissionNumber: ['', Validators.required], // Validation: Admission number is required
    password: ['', Validators.required], // Validation: Password is required
  });

  submit() {
    if (this.registerDetailsForm.valid) {
      // Navigate to login if the form is valid
      this.router.navigate(['/login']);
    } else {
      // Mark all controls as touched if the form is invalid
      this.markFormControlsAsTouched();
    }
  }

  fieldIsInvalid(control: string) {
    const field = this.registerDetailsForm.get(control);
    return field?.invalid && field?.touched;
  }

  private markFormControlsAsTouched() {
    Object.values(this.registerDetailsForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
