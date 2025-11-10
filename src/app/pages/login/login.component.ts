import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

// Importar Servicios, DTO y Alertas
import { AuthService } from '../../services/auth-service.service';
import { TokenService } from '../../services/token-service.service';
import { LoginDTO } from '../../models/login-dto.interface';
import Swal from 'sweetalert2';

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

    // Inyectar los servicios
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
            email: ['', [
                Validators.required,
                Validators.email
            ]],
            password: ['', [
                Validators.required,
                Validators.minLength(6)
            ]]
        });
    }

    // Lógica de login actualizada
    loginUser(): void {
        this.submitted = true;

        if (this.loginForm.invalid) {
            // Si el formulario es inválido, no hacemos nada más
            return;
        }

        // Obtenemos los datos del formulario y los convertimos a LoginDTO
        const loginDTO = this.loginForm.value as LoginDTO;

        this.authService.login(loginDTO).subscribe({
            next: (data) => {
                // Guardamos el token usando el servicio
                this.tokenService.login(data.content.token);

                // Redireccionamos al inicio y recargamos (como pide la guía)
                this.router.navigate(['/']).then(() => window.location.reload());
            },
            error: (error) => {
                // Mostramos el mensaje de error del backend
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.error.content // Mensaje de error de la API
                });
            }
        });
    }

    // Getter para acceder a los controles del formulario
    get f() { return this.loginForm.controls; }
}