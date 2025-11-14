import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service.service';
import { ForgotPasswordDTO } from '../../models/forgot-password-dto.interface';
import { ResetPasswordDTO } from '../../models/reset-password-dto.interface';

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

    emailForm!: FormGroup;
    resetPasswordForm!: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    codeSent = false; // Indica si ya se envió el código
    userEmail = ''; // Guarda el email del usuario

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForms();
    }

    /**
     * Inicializa los formularios reactivos con validaciones
     */
    private initializeForms(): void {
        // Formulario para solicitar el código
        this.emailForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        // Formulario para restablecer la contraseña
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
     * Getter para acceder a los controles del formulario de email
     */
    get e() {
        return this.emailForm.controls;
    }

    /**
     * Getter para acceder a los controles del formulario de reset
     */
    get f() {
        return this.resetPasswordForm.controls;
    }

    /**
     * Envía el código de verificación al correo
     */
    sendVerificationCode(): void {
        this.errorMessage = null;
        this.successMessage = null;

        if (this.emailForm.invalid) {
            this.emailForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.userEmail = this.emailForm.value.email;

        const dto: ForgotPasswordDTO = {
            email: this.userEmail
        };

        this.authService.forgotPassword(dto).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = response.content || "Código enviado correctamente a tu correo electrónico.";
                this.codeSent = true;
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || "Error al enviar el código de verificación.";
                console.error('Error al enviar código:', error);
            }
        });
    }

    /**
     * Maneja el envío del formulario de restablecimiento
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

        const dto: ResetPasswordDTO = {
            email: this.userEmail,
            token: codigo,
            newPassword: newPassword
        };

        this.authService.resetPassword(dto).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = response.content || "¡Contraseña restablecida correctamente!";

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    this.router.navigate(['/iniciar-sesion']);
                }, 2000);
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || "Error al restablecer la contraseña. Verifica el código.";
                console.error('Error al restablecer contraseña:', error);
            }
        });
    }

    /**
     * Volver al paso anterior (solicitar código nuevamente)
     */
    backToEmailForm(): void {
        this.codeSent = false;
        this.errorMessage = null;
        this.successMessage = null;
        this.resetPasswordForm.reset();
    }

    /**
     * Navega a la página de inicio de sesión
     */
    closeForm(): void {
        this.router.navigate(['/iniciar-sesion']);
    }
}