import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service.service';
import {TokenService} from "../services/token-service.service";


export const HostRoleGuard: CanActivateFn = (route, state) => {

    const authService = inject(AuthService);
    const router = inject(Router);
    const tokenService = inject(TokenService);

    const userRole = tokenService.getRole();

    if (userRole === 'HOST') {
        return true;
    }

    router.navigate(['/unauthorized']);
    return false;
};