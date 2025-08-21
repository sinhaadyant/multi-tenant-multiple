import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      // Check for required permissions
      const requiredPermissions = route.data['permissions'] as string[];
      if (requiredPermissions) {
        const hasPermission = requiredPermissions.some(permission => 
          this.authService.hasPermission(permission)
        );
        
        if (!hasPermission) {
          this.router.navigate(['/dashboard'], { 
            queryParams: { error: 'insufficient_permissions' } 
          });
          return false;
        }
      }

      // Check for required roles
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles) {
        const hasRole = requiredRoles.some(role => 
          this.authService.hasRole(role)
        );
        
        if (!hasRole) {
          this.router.navigate(['/dashboard'], { 
            queryParams: { error: 'insufficient_roles' } 
          });
          return false;
        }
      }

      return true;
    }

    // Not authenticated, redirect to login
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}
