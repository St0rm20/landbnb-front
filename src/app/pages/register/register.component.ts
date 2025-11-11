import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
            phoneNumber: ['', Validators.required],
            birthDate: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(8)]]
        });
    }

    public createUser() {
        this.submitted = true;

        if (this.registerForm.invalid) {
            Swal.fire({
                title: 'Campos incompletos',
                text: 'Por favor, revisa todos los campos del formulario.',
                icon: 'warning'
            });
            return;
        }

        const createUserDTO = this.registerForm.value as CreateUserDTO;

        this.authService.register(createUserDTO).subscribe({
            next: (data: any) => {
                Swal.fire({
                    title: '¡Registro Exitoso!',
                    text: data.message,
                    icon: 'success'
                });
            },
            error: (error) => {

                Swal.fire({
                    title: 'Error en el Registro',
                    text: error.error.message,
                    icon: 'error'
                });
            }
        });
    }

    get f() { return this.registerForm.controls; }
}