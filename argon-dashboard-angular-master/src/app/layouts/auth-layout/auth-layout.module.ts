import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AuthLayoutRoutes } from "./auth-layout.routing";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { LoginComponent } from "../../pages/login/login.component";
import { RegisterComponent } from "../../pages/register/register.component";
import { LoginCustomComponent } from "../../pages/login-custom/login-custom.component";
import { RegisterCustomComponent } from "../../pages/register-custom/register-custom.component";
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    // NgbModule
  ],
  declarations: [
    LoginComponent,
    RegisterComponent,
    LoginCustomComponent,
    RegisterCustomComponent,
  ],
})
export class AuthLayoutModule {}
