import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-profile-user',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule
    ],
    templateUrl: './profile-user.component.html',
    styleUrls: ['./profile-user.component.css']
})
export class ProfileUserComponent {

    // --- Lógica del Dropdown (Igual que en change-password) ---
    dropdownOpen = false;

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }


    profilePicUrl: string = 'assets/imagenes/perfil.png';
    perfilForm: FormGroup;

    constructor(private fb: FormBuilder) {
        // Creamos el formulario reactivo
        this.perfilForm = this.fb.group({
            nombre: ['Nombre del usuario', Validators.required],
            rol: [{ value: 'Usuario', disabled: true }],
            email: [{ value: 'usuario@ejemplo.com', disabled: true }],
            telefono: ['123-456-7890'],
            descripcionAnfitrion: [''] // El placeholder está en el HTML
        });
    }

    // Función para guardar
    guardarCambios(): void {
        if (this.perfilForm.valid) {
            console.log('Guardando:', this.perfilForm.getRawValue());
            alert('¡Perfil actualizado!');
        }
    }

    // Función para la foto
    onFotoSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            console.log('Archivo seleccionado:', file.name);
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.profilePicUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}