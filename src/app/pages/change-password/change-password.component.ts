import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user-service.service';
import { ChangePasswordDTO } from '../../models/change-password-dto.interface';

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
        private fb: FormBuilder,
        private userService: UserService
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

        const dto: ChangePasswordDTO = {
            currentPassword: currentPassword,
            newPassword: newPassword
        };

        this.userService.changePassword(dto).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = response.content || "¡Contraseña actualizada correctamente!";
                this.changePasswordForm.reset();

                // Limpiar el mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    this.successMessage = null;
                }, 5000);
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Error al cambiar contraseña:', error);

                // Manejo detallado de errores
                if (error.status === 401) {
                    this.errorMessage = "La contraseña actual no es correcta.";
                } else if (error.status === 400) {
                    this.errorMessage = error.error?.message || "Datos inválidos. Verifica la información ingresada.";
                } else if (error.status === 0) {
                    this.errorMessage = "Error de conexión. Verifica tu internet.";
                } else {
                    this.errorMessage = error.error?.message || "Error al cambiar la contraseña. Inténtalo nuevamente.";
                }
            }
        });
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