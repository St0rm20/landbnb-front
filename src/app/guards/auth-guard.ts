// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth-service.service';
import {TokenService} from "../services/token-service.service";

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
        private tokenService: TokenService
    ) {}

    canActivate(): boolean {
      console.log("puede inciar ruta" + this.tokenService.isLogged());
        if (this.tokenService.isLogged()) {
            return true;
        }

        this.router.navigate(['/login']);
        return false;
    }
}