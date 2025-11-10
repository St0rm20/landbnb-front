import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// import { AuthServiceService } from '../services/auth.service'; // Descomenta cuando tengas tu servicio

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule
    ]
})
export class ForgotPasswordComponent implements OnInit {

    resetPasswordForm!: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router
        // private authService: AuthServiceService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    /**
     * Inicializa el formulario reactivo con validaciones
     */
    private initializeForm(): void {
        this.resetPasswordForm = this.fb.group({
            codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatcher
        });
    }

    /**
     * Validador personalizado para verificar que las contraseñas coincidan
     */
    private passwordMatcher(formGroup: FormGroup): { [key: string]: boolean } | null {
        const newPassword = formGroup.get('newPassword');
        const confirmPassword = formGroup.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    /**
     * Getter para acceder a los controles del formulario
     */
    get f() {
        return this.resetPasswordForm.controls;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        this.errorMessage = null;
        this.successMessage = null;

        if (this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const { codigo, newPassword } = this.resetPasswordForm.value;

        console.log('Enviando al backend:', { codigo, newPassword });

        // Simulación de llamada a API
        setTimeout(() => {
            this.isLoading = false;
            this.successMessage = "¡Contraseña restablecida correctamente!";

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                this.router.navigate(['/iniciar-sesion']);
            }, 2000);

            // Para simular un error, descomenta:
            // this.errorMessage = "El código de verificación no es válido.";
        }, 1500);

        /* Cuando conectes con tu backend, reemplaza el setTimeout por:
        this.authService.resetPassword(codigo, newPassword).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = "¡Contraseña restablecida correctamente!";
                setTimeout(() => {
                    this.router.navigate(['/iniciar-sesion']);
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || "Error al restablecer la contraseña.";
            }
        });
        */
    }

    /**
     * Navega a la página de inicio de sesión
     */
    closeForm(): void {
        this.router.navigate(['/iniciar-sesion']);
    }
}