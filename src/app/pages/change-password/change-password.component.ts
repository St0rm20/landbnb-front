import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// import { AuthService } from '../services/auth.service'; // Descomenta cuando tengas tu servicio

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule
    ]
})
export class ChangePasswordComponent implements OnInit {

    changePasswordForm!: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    dropdownOpen = false;

    constructor(
        private fb: FormBuilder
        // private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
    }

    /**
     * Inicializa el formulario reactivo con validaciones
     */
    private initializeForm(): void {
        this.changePasswordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatcher
        });
    }

    /**
     * Validador personalizado para verificar que las contraseñas coincidan
     */
    private passwordMatcher(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword');
        const confirmPassword = control.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    /**
     * Getter para acceder a los controles del formulario
     */
    get f() {
        return this.changePasswordForm.controls;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        this.errorMessage = null;
        this.successMessage = null;

        if (this.changePasswordForm.invalid) {
            this.changePasswordForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const { currentPassword, newPassword } = this.changePasswordForm.value;

        console.log('Enviando al backend:', { currentPassword, newPassword });

        // Simulación de llamada a API
        setTimeout(() => {
            this.isLoading = false;
            this.successMessage = "¡Contraseña actualizada correctamente!";
            this.changePasswordForm.reset();

            // Para simular un error, descomenta:
            // this.errorMessage = "La contraseña actual no es correcta.";
        }, 1500);

        /* Cuando conectes con tu backend, reemplaza el setTimeout por:
        this.authService.changePassword(currentPassword, newPassword).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = "¡Contraseña actualizada correctamente!";
                this.changePasswordForm.reset();
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || "Error al cambiar la contraseña.";
            }
        });
        */
    }

    /**
     * Cerrar dropdown al hacer clic fuera
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    /**
     * Toggle del menú dropdown
     */
    toggleDropdown(event: Event): void {
        event.preventDefault();
        this.dropdownOpen = !this.dropdownOpen;
    }
}