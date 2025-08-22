import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-login-custom",
  templateUrl: "./login-custom.component.html",
  styleUrls: ["./login-custom.component.scss"],
})
export class LoginCustomComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  returnUrl: string = "/dashboard";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/dashboard"]);
      return;
    }

    // Get return URL from route parameters
    this.returnUrl =
      this.route.snapshot.queryParams["returnUrl"] || "/dashboard";
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log("Login successful:", response);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error("Login failed:", error);
        this.error = error.error?.message || "Login failed. Please try again.";
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper methods for template
  get emailControl() {
    return this.loginForm.get("email");
  }
  get passwordControl() {
    return this.loginForm.get("password");
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors["required"]) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } is required`;
      }
      if (field.errors["email"]) {
        return "Please enter a valid email address";
      }
      if (field.errors["minlength"]) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must be at least ${
          field.errors["minlength"].requiredLength
        } characters`;
      }
    }
    return "";
  }
}
