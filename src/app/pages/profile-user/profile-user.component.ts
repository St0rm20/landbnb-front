import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // <-- CAMBIO 1: Importado DatePipe
import {Router, RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user-service.service';
import { TokenService } from '../../services/token-service.service';
import { UpdateProfileDTO } from '../../models/update-profile-dto.interface';
import { UserDto } from '../../models/user-dto.interface';
import Swal from 'sweetalert2';
import {AccommodationService} from "../../services/accommodation-service.service";

@Component({
    selector: 'app-profile-user',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule
    ],
    providers: [ DatePipe ], // <-- CAMBIO 2: Añadido DatePipe a los providers
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
        private tokenService: TokenService,
        private datePipe: DatePipe ,
        private router: Router

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
            dateBirth: ['']
        });
    }

    loadUserProfile(): void {
        this.isLoading = true;

        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userData = data;

                if (data.profilePictureUrl) {
                    this.profilePicUrl = data.profilePictureUrl;
                }

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
console.log('nombre dentro del formulario: ' + this.perfilForm.value.name);
        // --- INICIO DE LA SOLUCIÓN (TRIM) ---
        const formValues = this.perfilForm.value;

        // --- INICIO DEL ARREGLO (TS2322: null vs undefined) ---

        // 1. Obtenemos la fecha (puede ser string u objeto Date)
        const rawDate = formValues.dateBirth;

        // 2. Transformamos la fecha. datePipe.transform devuelve 'string | null'
        const transformedDate = rawDate ? this.datePipe.transform(rawDate, 'yyyy-MM-dd') : null;

        // 3. Convertimos 'null' a 'undefined' para que coincida con la interfaz UpdateProfileDTO
        const formattedDate = (transformedDate === null) ? undefined : transformedDate;

        // --- FIN DEL ARREGLO ---

        // 4. Preparamos el DTO "limpiando" cada campo de texto
        const updateDTO: UpdateProfileDTO = {
            // Usamos .trim() para quitar espacios al inicio y al final
            name: formValues.name ? formValues.name.trim() : '',
            lastName: formValues.lastName ? formValues.lastName.trim() : '',
            phoneNumber: formValues.phoneNumber ? formValues.phoneNumber.trim() : '',
            description: formValues.description ? formValues.description.trim() : '',
            bio: formValues.bio ? formValues.bio.trim() : '',

            dateBirth: formattedDate, // <-- Ahora es 'string | undefined', lo cual es correcto

            photoProfile: this.profilePicUrl !== 'assets/imagenes/perfil.png' ? this.profilePicUrl : undefined
        };

        // --- FIN DE LA SOLUCIÓN (TRIM) ---

        // Este log ahora mostrará los datos limpios
        console.log('Enviando este DTO (limpio) al backend:', updateDTO);

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
                this.loadUserProfile();
            },
            error: (error) => {
                console.error('Error al actualizar perfil:', error);
                this.isLoading = false;
                let errorMessage = 'No se pudo actualizar el perfil';
                if (error.error && error.error.content && Array.isArray(error.error.content) && error.error.content.length > 0) {
                    errorMessage = error.error.content[0].message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    text: errorMessage
                });
            }
        });
    }

    onFotoSelected(event: any): void {
        const file: File = event.target.files[0];

        if (file) {
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo no válido',
                    text: 'Por favor selecciona una imagen (JPG, PNG o GIF)'
                });
                return;
            }

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

    protected getUserLastName() {
        return this.userData?.lastName || '';
    }

    protected getUserName() {
        return this.userData?.name || '';
    }

    protected getUserPhone() {
        return this.userData?.phoneNumber || '';
    }

    protected getUserBio() {
        return this.userData?.bio || '';
    }

    protected getProfilePicUrl() {
        return this.userData?.profilePictureUrl || this.profilePicUrl;
    }
}