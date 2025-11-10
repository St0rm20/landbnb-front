import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

// 1. Importar el servicio y DTO correctos
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

    // 2. Inyectar AuthService
    constructor(
        private fb: FormBuilder,
        private authService: AuthService
    ) {
        // 3. Formulario
        this.registerForm = this.fb.group({
            name: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', Validators.required],
            birthDate: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    // 4. Lógica de registro
    public createUser() {
        this.submitted = true;

        if (this.registerForm.invalid) {
            return;
        }

        const createUserDTO = this.registerForm.value as CreateUserDTO;

        // 5. Usar authService.register()
        this.authService.register(createUserDTO).subscribe({
            next: (data) => {
                Swal.fire({
                    title: 'Éxito',
                    text: data.content,
                    icon: 'success'
                });
            },
            error: (error) => {
                Swal.fire({
                    title: 'Error',
                    text: error.error.content,
                    icon: 'error'
                });
            }
        });
    }

    get f() { return this.registerForm.controls; }
}