import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

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

    constructor(private fb: FormBuilder, private router: Router) {
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

    loginUser(): void {
        this.submitted = true;

        if (this.loginForm.valid) {
            console.log('Login válido:', this.loginForm.value);
            // Aquí iría tu lógica de autenticación
            // this.authService.login(this.loginForm.value).subscribe(...)

            // Redirigir al home después del login
            this.router.navigate(['/']);
        }
    }

    get f() { return this.loginForm.controls; }
}