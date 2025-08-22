import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-register-custom",
  templateUrl: "./register-custom.component.html",
  styleUrls: ["./register-custom.component.scss"],
})
export class RegisterCustomComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  invitationToken: string | null = null;
  isInvitation = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ["", [Validators.required, Validators.maxLength(50)]],
        lastName: ["", [Validators.required, Validators.maxLength(50)]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(8)]],
        confirmPassword: ["", [Validators.required]],
        agreeToTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(["/dashboard"]);
      return;
    }

    // Check for invitation token
    this.invitationToken = this.route.snapshot.queryParams["token"];
    this.isInvitation = !!this.invitationToken;

    // If invitation, pre-fill email if available
    if (this.isInvitation) {
      const email = this.route.snapshot.queryParams["email"];
      if (email) {
        this.registerForm.patchValue({ email });
        this.registerForm.get("email")?.disable();
      }
    }
  }

  // Custom validator for password confirmation
  passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get("password");
    const confirmPassword = control.get("confirmPassword");

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.registerForm.value;
    const registrationData = {
      email: formValue.email.toLowerCase().trim(),
      password: formValue.password,
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      ...(this.invitationToken && { invitationToken: this.invitationToken }),
    };

    // Use appropriate endpoint based on invitation
    const registerObservable = this.isInvitation
      ? this.authService.acceptInvitation(registrationData)
      : this.authService.register(registrationData);

    registerObservable.subscribe({
      next: (response) => {
        console.log("Registration successful:", response);
        this.successMessage =
          response.data?.message || "Registration successful!";

        // If registration successful and doesn't require verification, redirect to login
        if (!response.data?.requiresVerification) {
          setTimeout(() => {
            this.router.navigate(["/login"], {
              queryParams: {
                message: "Registration successful! Please log in.",
              },
            });
          }, 2000);
        }
      },
      error: (error) => {
        console.error("Registration failed:", error);
        this.error =
          error.error?.message || "Registration failed. Please try again.";
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
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
      if (field.errors["maxlength"]) {
        return `${
          fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        } must not exceed ${
          field.errors["maxlength"].requiredLength
        } characters`;
      }
      if (field.errors["requiredTrue"]) {
        return "You must agree to the terms and conditions";
      }
    }

    // Check form-level errors
    if (
      fieldName === "confirmPassword" &&
      this.registerForm.errors?.["passwordMismatch"]
    ) {
      return "Passwords do not match";
    }

    return "";
  }

  getPasswordStrength(): {
    strength: string;
    color: string;
    percentage: number;
  } {
    const password = this.registerForm.get("password")?.value || "";

    if (password.length === 0) {
      return { strength: "", color: "", percentage: 0 };
    }

    let score = 0;

    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character types
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { strength: "weak", color: "danger", percentage: 25 };
    } else if (score <= 4) {
      return { strength: "fair", color: "warning", percentage: 50 };
    } else if (score <= 5) {
      return { strength: "good", color: "info", percentage: 75 };
    } else {
      return { strength: "strong", color: "success", percentage: 100 };
    }
  }
}
