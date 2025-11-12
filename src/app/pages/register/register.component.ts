import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth-service.service';
import { CreateUserDTO } from '../../models/create-user-dto.interface';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {

    registerForm: FormGroup;
    submitted = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
            birthDate: ['', [Validators.required, this.ageValidator]],
            password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]]
        });
    }

    // Validador personalizado para edad mayor de 18 años
    private ageValidator(control: AbstractControl): { [key: string]: any } | null {
        if (!control.value) {
            return null;
        }

        const birthDate = new Date(control.value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        const hasHadBirthday = monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birthDate.getDate());
        const finalAge = hasHadBirthday ? age : age - 1;

        return finalAge >= 18 ? null : { underAge: true };
    }

    // Validador personalizado para contraseña
    private passwordValidator(control: AbstractControl): { [key: string]: any } | null {
        if (!control.value) {
            return null;
        }

        const password = control.value;
        const errors: any = {};

        // Mínimo 8 caracteres
        if (password.length < 8) {
            errors.minlength = { requiredLength: 8, actualLength: password.length };
        }

        // Al menos una mayúscula
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.uppercase = true;
        }

        // Al menos una minúscula
        if (!/(?=.*[a-z])/.test(password)) {
            errors.lowercase = true;
        }

        // Al menos un número
        if (!/(?=.*\d)/.test(password)) {
            errors.number = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    public createUser() {
        this.submitted = true;

        if (this.registerForm.invalid) {
            this.showFormErrors();
            return;
        }


        const formData = this.prepareFormData();

        this.authService.register(formData).subscribe({
            next: (data: any) => {
                Swal.fire({
                    title: '¡Registro Exitoso!',
                    text: data.message,
                    icon: 'success'
                });
                this.registerForm.reset();
                this.submitted = false;
            },
            error: (error) => {
                console.error(' Error completo del servidor:', error);
                console.error(' Detalles del error:', error.error);

                this.handleRegistrationError(error);
            }
        });
    }

    private prepareFormData(): CreateUserDTO {
        const rawData = this.registerForm.value;

        // Formatear la fecha a YYYY-MM-DD (formato ISO)
        let formattedBirthDate = rawData.birthDate;
        if (rawData.birthDate) {
            const date = new Date(rawData.birthDate);
            formattedBirthDate = date.toISOString().split('T')[0];
        }

        return {
            name: rawData.name?.trim(),
            lastName: rawData.lastName?.trim(),
            email: rawData.email?.trim().toLowerCase(),
            phoneNumber: rawData.phoneNumber?.trim(),
            birthDate: formattedBirthDate,
            password: rawData.password
        };
    }

    private handleRegistrationError(error: any): void {
        let errorMessage = 'Ha ocurrido un error inesperado';

        // Intentar obtener mensajes específicos del backend
        if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (error.error.errors) {
                // Si hay errores de validación específicos
                const validationErrors = Object.values(error.error.errors).flat();
                errorMessage = `Errores de validación: ${validationErrors.join(', ')}`;
            } else if (error.error.content && Array.isArray(error.error.content)) {
                // Si el error viene en formato content array
                errorMessage = error.error.content.join(', ');
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire({
            title: 'Error en el Registro',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    }

    private showFormErrors(): void {
        const errors = [];

        if (this.f['name'].errors?.['required']) errors.push('El nombre es requerido');
        if (this.f['lastName'].errors?.['required']) errors.push('El apellido es requerido');
        if (this.f['email'].errors?.['required']) errors.push('El email es requerido');
        else if (this.f['email'].errors?.['email']) errors.push('Formato de email inválido');
        if (this.f['phoneNumber'].errors?.['required']) errors.push('El teléfono es requerido');
        else if (this.f['phoneNumber'].errors?.['pattern']) errors.push('El teléfono debe contener solo números');
        if (this.f['birthDate'].errors?.['required']) errors.push('La fecha de nacimiento es requerida');
        else if (this.f['birthDate'].errors?.['underAge']) errors.push('Debes ser mayor de 18 años para registrarte');

        // Errores específicos de contraseña
        if (this.f['password'].errors?.['required']) {
            errors.push('La contraseña es requerida');
        } else if (this.f['password'].errors) {
            const passwordErrors = this.f['password'].errors;
            if (passwordErrors['minlength']) errors.push('La contraseña debe tener al menos 8 caracteres');
            if (passwordErrors['uppercase']) errors.push('La contraseña debe contener al menos una letra mayúscula');
            if (passwordErrors['lowercase']) errors.push('La contraseña debe contener al menos una letra minúscula');
            if (passwordErrors['number']) errors.push('La contraseña debe contener al menos un número');
            if (passwordErrors['special']) errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
        }

        Swal.fire({
            title: 'Errores en el formulario',
            html: errors.map(error => `• ${error}`).join('<br>'),
            icon: 'warning'
        });
    }

    get f() { return this.registerForm.controls; }
}