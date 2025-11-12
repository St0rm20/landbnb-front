import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user-service.service';
import { TokenService } from '../../services/token-service.service';
import { ImageService } from '../../services/image-service'; // Asegúrate de importar tu servicio
import { UpdateProfileDTO } from '../../models/update-profile-dto.interface';
import { UserDto } from '../../models/user-dto.interface';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-profile-user',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule
    ],
    providers: [ DatePipe ],
    templateUrl: './profile-user.component.html',
    styleUrls: ['./profile-user.component.css']
})
export class ProfileUserComponent implements OnInit {

    dropdownOpen = false;
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    perfilForm: FormGroup;
    isLoading = false;
    isUploading = false;
    userData: UserDto | null = null;
    selectedFile: File | null = null;
    newImageUrl: string | null = null;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private tokenService: TokenService,
        private datePipe: DatePipe,
        private router: Router,
        private imageService: ImageService
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
            dateBirth: ['', [this.ageValidator.bind(this)]]
        });
    }

    // Validador personalizado para edad mínima de 18 años
    ageValidator(control: any) {
        if (!control.value) {
            return null; // Si no hay valor, no validamos
        }

        const birthDate = new Date(control.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Ajustar la edad si aún no ha cumplido años este año
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 18 ? null : { underAge: true };
    }

    loadUserProfile(): void {
        this.isLoading = true;

        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userData = data;

                if (data.profilePictureUrl) {
                    this.profilePicUrl = data.profilePictureUrl;
                }

                // Formatear la fecha antes de cargarla
                // El backend puede enviar 'dateOfBirth' o 'dateBirth'
                const birthDate = (data as any).dateOfBirth || data.dateBirth;
                let formattedDate = '';

                if (birthDate) {
                    // La fecha viene como "2005-11-16" del backend
                    formattedDate = birthDate.split('T')[0]; // Por si viene con hora
                }

                this.perfilForm.patchValue({
                    name: data.name || '',
                    lastName: data.lastName || '',
                    phoneNumber: data.phoneNumber || '',
                    bio: data.bio || '',
                    dateBirth: formattedDate
                });

                console.log('Fecha cargada:', formattedDate);
                console.log('Datos completos del usuario:', data);

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

    async guardarCambios(): Promise<void> {
        if (this.perfilForm.invalid) {
            // Verificar si el error es por edad menor de 18
            if (this.perfilForm.get('dateBirth')?.hasError('underAge')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Edad no válida',
                    text: 'Debes ser mayor de 18 años para usar esta plataforma'
                });
                return;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Por favor, completa correctamente todos los campos'
            });
            return;
        }

        this.isLoading = true;

        try {
            // Si hay una imagen nueva seleccionada, subirla primero
            if (this.selectedFile) {
                this.newImageUrl = await this.uploadImage();
            }

            const formValues = this.perfilForm.value;

            // Transformar la fecha
            const rawDate = formValues.dateBirth;
            const transformedDate = rawDate ? this.datePipe.transform(rawDate, 'yyyy-MM-dd') : null;
            const formattedDate = (transformedDate === null) ? undefined : transformedDate;

            // Preparar el DTO con los valores actualizados
            const updateDTO: UpdateProfileDTO = {
                name: formValues.name ? formValues.name.trim() : '',
                lastName: formValues.lastName ? formValues.lastName.trim() : '',
                phoneNumber: formValues.phoneNumber ? formValues.phoneNumber.trim() : '',
                description: formValues.description ? formValues.description.trim() : '',
                bio: formValues.bio ? formValues.bio.trim() : '',
                dateBirth: formattedDate,
                // Usar la nueva URL si se subió una imagen, sino mantener la existente
                photoProfile: this.newImageUrl ||
                    (this.profilePicUrl !== 'assets/imagenes/perfil.png' ? this.profilePicUrl : undefined)
            };

            console.log('Enviando este DTO al backend:', updateDTO);

            this.userService.updateProfile(updateDTO).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.selectedFile = null;
                    this.newImageUrl = null;

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

        } catch (error) {
            console.error('Error en el proceso de guardado:', error);
            this.isLoading = false;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al guardar los cambios'
            });
        }
    }

    async uploadImage(): Promise<string> {
        if (!this.selectedFile) {
            throw new Error('No hay archivo seleccionado para subir.');
        }

        this.isUploading = true;

        Swal.fire({
            title: 'Subiendo imagen...',
            text: 'Por favor, espere.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const data = await firstValueFrom(this.imageService.upload(this.selectedFile));
            const uploadedUrl: string = data.content.url;

            Swal.close();
            this.isUploading = false;

            return uploadedUrl;
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            this.isUploading = false;
            Swal.fire('Error', 'No se pudo subir la imagen', 'error');
            throw error;
        }
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

            // Guardar el archivo para subirlo después
            this.selectedFile = file;

            // Mostrar preview local
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.profilePicUrl = e.target.result;
                console.log('Imagen seleccionada:', file.name);
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

    // Método para formatear la fecha para el input type="date"
    private formatDateForInput(dateString: string): string {
        if (!dateString) return '';

        // Si ya viene en formato yyyy-MM-dd, devolverla tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Si viene en otro formato, convertirla
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    protected getUserDateBirth() {
        return this.userData?.dateBirth ? this.formatDateForInput(this.userData.dateBirth) : '';
    }
}