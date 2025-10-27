import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-register',
    standalone: true, // Si estás usando componentes standalone
    imports: [CommonModule, ReactiveFormsModule, RouterLink], // Importa los módulos necesarios
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    registerForm: FormGroup;
    submitted = false;

    constructor(private fb: FormBuilder) {
        this.registerForm = this.createForm();
    }

    createForm(): FormGroup {
        return this.fb.group({
            name: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50)
            ]],
            email: ['', [
                Validators.required,
                Validators.email
            ]],
            phone: ['', [
                Validators.required,
                Validators.pattern(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
            ]],
            dateBirth: ['', [
                Validators.required,
                this.ageValidator
            ]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).+$/)
            ]]
        });
    }

    ageValidator(control: AbstractControl): { [key: string]: any } | null {
        const value = control.value;
        if (!value) return null;

        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Ajustar la edad si aún no ha pasado el cumpleaños este año
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Verificar si es mayor de 18 años
        if (age < 18) {
            return { 'underage': true };
        }

        return null;
    }

    createUser(): void {
        this.submitted = true;

        if (this.registerForm.valid) {
            console.log('Formulario válido:', this.registerForm.value);
            // Aquí tu lógica para crear el usuario
        }
    }

    // Helper methods para acceder a los controles
    get f() { return this.registerForm.controls; }
}

export class Register {
}