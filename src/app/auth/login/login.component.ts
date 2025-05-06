import { NgClass, NgIf } from "@angular/common"
import { Component } from "@angular/core"
import { FormsModule, type NgForm } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { AuthService } from "../../services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, RouterModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  errorMessage = ""
  selectedRole = "student"
  userId = ""
  password = ""
  isLoading = false

  // Property to control the shake animation
  formShake = false

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  getPlaceholder(): string {
    return this.selectedRole === "teacher" ? "Teacher ID" : "Admission Number"
  }

  get dynamicFieldName(): string {
    return this.selectedRole === "teacher" ? "teacherId" : "admissionNumber"
  }

  // Method to trigger shake animation
  triggerShake() {
    this.formShake = true
    setTimeout(() => {
      this.formShake = false
    }, 600)
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.isLoading = true
      const credentials =
        this.selectedRole === "teacher"
          ? { teacher_id: this.userId, password: this.password, role: "teacher" }
          : { adm_no: this.userId, password: this.password, role: "student" }

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log("Login successful:", response)
          // The navigation is now handled in the AuthService
        },
        error: (err) => {
          console.error("Login failed:", err)
          this.errorMessage = err.error.message || "Login failed. Try again."
          this.isLoading = false
          this.triggerShake() // Trigger shake animation on error
        },
      })
    } else {
      console.log("Form is invalid")
      this.triggerShake() // Trigger shake animation on validation error
    }
  }
}
