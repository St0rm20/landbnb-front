import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user-service.service';
import { TokenService } from '../../services/token-service.service';
import { UpdateProfileDTO } from '../../models/update-profile-dto.interface';
import { UserDto } from '../../models/user-dto.interface';
import Swal from 'sweetalert2';

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
export class ProfileUserComponent implements OnInit {

    dropdownOpen = false;
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    perfilForm: FormGroup;
    isLoading = false;
    userData: UserDto | null = null;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private tokenService: TokenService
    ) {
        this.perfilForm = this.createForm();
    }

    ngOnInit(): void {
        this.loadUserProfile();
    }

    createForm(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            lastName: ['', [Validators.maxLength(100)]],
            phoneNumber: ['', [Validators.pattern(/^[+]?\d{7,15}$/)]],
            description: ['', [Validators.maxLength(500)]],
            bio: ['', [Validators.maxLength(500)]],
            dateBirth: ['', [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]]
        });
    }

    loadUserProfile(): void {
        this.isLoading = true;

        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userData = data;

                // Actualizar la foto de perfil si existe
                if (data.photoProfile) {
                    this.profilePicUrl = data.photoProfile;
                }

                // Rellenar el formulario con los datos del usuario
                this.perfilForm.patchValue({
                    name: data.name || '',
                    lastName: data.lastName || '',
                    phoneNumber: data.phoneNumber || '' ,
                    bio: data.bio || '',
                    dateBirth: data.dateBirth || ''
                });

                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar perfil:', error);
                this.isLoading = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar la información del perfil'
                });

                // Si hay error de autenticación, redirigir al login
                if (error.status === 401 || error.status === 403) {
                    this.tokenService.logout();
                }
            }
        });
    }

    guardarCambios(): void {
        if (this.perfilForm.invalid) {
            Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Por favor, completa correctamente todos los campos'
            });
            return;
        }

        this.isLoading = true;

        // Preparar el DTO solo con los campos que han cambiado
        const updateDTO: UpdateProfileDTO = {
            ...this.perfilForm.value,
            photoProfile: this.profilePicUrl !== 'assets/imagenes/perfil.png' ? this.profilePicUrl : undefined
        };

        this.userService.updateProfile(updateDTO).subscribe({
            next: (response) => {
                this.isLoading = false;

                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: response.content || 'Perfil actualizado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Recargar los datos del perfil
                this.loadUserProfile();
            },
            error: (error) => {
                console.error('Error al actualizar perfil:', error);
                this.isLoading = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.error?.message || 'No se pudo actualizar el perfil'
                });
            }
        });
    }

    onFotoSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file) {
            // Validar tipo de archivo
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo no válido',
                    text: 'Por favor selecciona una imagen (JPG, PNG o GIF)'
                });
                return;
            }

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo muy grande',
                    text: 'La imagen no debe superar los 5MB'
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.profilePicUrl = e.target.result;

                // Aquí podrías hacer una llamada al backend para subir la imagen
                // Por ahora solo la mostramos en preview
                console.log('Imagen cargada:', file.name);
            };
            reader.readAsDataURL(file);
        }
    }

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

    get f() { return this.perfilForm.controls; }

    // Métodos helper para mostrar los datos del usuario
    getUserFullName(): string {
        if (!this.userData) return 'Usuario';
        return `${this.userData.name} ${this.userData.lastName || ''}`.trim();
    }

    getUserEmail(): string {
        return this.userData?.email || 'usuario@ejemplo.com';
    }


}