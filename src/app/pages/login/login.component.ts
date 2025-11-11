import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service.service';
import { TokenService } from '../../services/token-service.service';
import { LoginDTO } from '../../models/login-dto.interface';
import Swal from 'sweetalert2';


interface AuthResponse {
    token: string;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    submitted = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private tokenService: TokenService
    ) {
        this.loginForm = this.createForm();
    }

    createForm(): FormGroup {
        return this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    loginUser(): void {
        this.submitted = true;

        if (this.loginForm.invalid) {
            return;
        }

        const loginDTO = this.loginForm.value as LoginDTO;

        this.authService.login(loginDTO).subscribe({
            // 👇 CORRECCIÓN: 'data' ya no es ResponseDTO, es AuthResponse
            next: (data: any) => {

                // 👇 CORRECCIÓN: No usamos 'data.content.token', sino 'data.token'
                this.tokenService.login(data.token);

                this.router.navigate(['/home']).then(() => window.location.reload());
            },
            error: (error) => {

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.error.message || 'Credenciales inválidas'
                });
            }
        });
    }

    get f() { return this.loginForm.controls; }
}