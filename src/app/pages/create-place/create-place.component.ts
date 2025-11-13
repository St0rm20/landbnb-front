import { Component, AfterViewInit, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { MapService, LocationDTO } from '../../services/map-service';
import Swal from 'sweetalert2';

import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import { ImageService } from '../../services/image-service';
import { AccommodationService } from '../../services/accommodation-service.service';
import { CreateAccommodationDTO } from '../../models/create-accommodation-dto.interface';
import { ResponseDTO } from '../../models/response-dto.interface';

@Component({
    selector: 'app-create-place',
    templateUrl: './create-place.component.html',
    styleUrls: ['./create-place.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class CreatePlaceComponent implements OnInit, AfterViewInit, OnDestroy {
    createPlaceForm: FormGroup;

    citiesList = [
        'Armenia', 'Pereira', 'Manizales', 'Medellín', 'Bogotá', 'Cali', 'Cartagena',
        'Barranquilla', 'Bucaramanga', 'Cúcuta', 'Ibagué', 'Villavicencio',
        'Santa Marta', 'Montería', 'Valledupar', 'Popayán', 'Sincelejo', 'Tunja',
        'Riohacha', 'Quibdó'
    ];
    servicesList = ['WiFi', 'Piscina', 'Cocina', 'Mascotas', 'Aire Acondicionado', 'Parking'];

    services: string[] = [];
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    selectedLocation: LocationDTO | null = null;
    private markerSub?: Subscription;
    isUploading: boolean = false;

    // Propiedades para el navbar y perfil
    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    constructor(
        private fb: FormBuilder,
        private mapService: MapService,
        private router: Router,
        private tokenService: TokenService,
        private userService: UserService,
        private imageService: ImageService,
        private accommodationService: AccommodationService
    ) {
        //  Latitude y Longitude SIN Validators.required
        this.createPlaceForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            pricePerNight: [null, [Validators.required, Validators.min(1)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            city: ['', Validators.required],
            address: ['', Validators.required],
            maxCapacity: [1, [Validators.required, Validators.min(1)]],
            latitude: [null],  // SIN REQUIRED
            longitude: [null], // SIN REQUIRED
            mainImage: [''],
            images: [[]],
            services: [[]]
        });
    }

    ngOnInit(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.router.navigate(['/login']);
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.initializeMap(), 100);
    }

    // ===== MÉTODOS DE PERFIL Y NAVBAR =====

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = data.name;
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
                console.log(' Usuario cargado:', data.name);
            },
            error: (error: any) => {
                console.error("Error cargando perfil", error);
                this.userName = this.userEmail;
                this.profilePicUrl = 'assets/imagenes/perfil.png';
            }
        });
    }

    private fixCloudinaryUrl(url: string | null | undefined): string {
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            return '';
        }
        if (url.startsWith('https://')) {
            return url;
        }
        if (url.includes('cloudinary.com') && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        if (url.startsWith('http://') && !url.includes('localhost')) {
            return url.replace('http://', 'https://');
        }
        if (url.includes('cloudinary.com') && !url.startsWith('http')) {
            return 'https://' + url;
        }
        return url;
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

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    get isHost(): boolean {
        return this.userRole === 'HOST';
    }

    get isUser(): boolean {
        return this.userRole === 'USER';
    }

    getUserFullName(): string {
        return this.userName || 'Usuario';
    }

    // ===== MÉTODOS DEL FORMULARIO Y MAPA =====

    private async initializeMap(): Promise<void> {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Contenedor del mapa no encontrado');
                return;
            }

            const defaultCenter: [number, number] = [-75.6811, 4.5370];
            const zoom = 13;

            await this.mapService.initializeMap('map', defaultCenter, zoom);
            console.log(' Mapa inicializado');

            this.markerSub = this.mapService.addMarkerOnClick().subscribe({
                next: (coords: any) => {
                    this.selectedLocation = {
                        latitude: coords.lat,
                        longitude: coords.lng
                    };

                    this.createPlaceForm.patchValue({
                        latitude: this.selectedLocation.latitude,
                        longitude: this.selectedLocation.longitude
                    });
                },
                error: (err) => { console.error('Error al seleccionar ubicación:', err); }
            });
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
        }
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        this.selectedFiles = Array.from(input.files);

        if (this.selectedFiles.length > 10) {
            Swal.fire('Error', 'Máximo 10 imágenes permitidas.', 'warning');
            this.selectedFiles = [];
            input.value = '';
            return;
        }

        // Validar que todas sean imágenes
        const validFiles = this.selectedFiles.filter(f => f.type.startsWith('image/'));
        if (validFiles.length !== this.selectedFiles.length) {
            Swal.fire(' Error', 'Solo se permiten archivos de imagen', 'warning');
            this.selectedFiles = [];
            input.value = '';
            return;
        }

        console.log(` ${this.selectedFiles.length} imagen(es) seleccionada(s)`);
        this.createImagePreviews();
    }

    async uploadImages(): Promise<string[]> {
        this.isUploading = true;

        Swal.fire({
            title: 'Subiendo imágenes...',
            text: `0 de ${this.selectedFiles.length} completadas.`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const uploadedUrls: string[] = [];
        let completed = 0;

        for (const file of this.selectedFiles) {
            try {
                const data = await firstValueFrom(this.imageService.upload(file));
                uploadedUrls.push(data.content.url);
                completed++;

                Swal.update({
                    text: `${completed} de ${this.selectedFiles.length} completadas.`
                });

                console.log(` Imagen ${completed} subida:`, data.content.url);
            } catch (error) {
                console.error(" Error subiendo imagen:", error);
                this.isUploading = false;
                Swal.fire(' Error', 'No se pudo subir una de las imágenes', 'error');
                throw error;
            }
        }

        this.isUploading = false;
        Swal.close();
        return uploadedUrls;
    }

    async onSubmit(): Promise<void> {
        console.log('=== INICIANDO ENVÍO DEL FORMULARIO ===');

        this.createPlaceForm.markAllAsTouched();

        //  VALIDACIÓN MANUAL DE CAMPOS REQUERIDOS
        const invalidFields: string[] = [];

        if (!this.createPlaceForm.value.title?.trim()) {
            invalidFields.push('Título');
        }
        if (!this.createPlaceForm.value.description?.trim()) {
            invalidFields.push('Descripción');
        }
        if (!this.createPlaceForm.value.city) {
            invalidFields.push('Ciudad');
        }
        if (!this.createPlaceForm.value.address?.trim()) {
            invalidFields.push('Dirección');
        }
        if (!this.createPlaceForm.value.pricePerNight || this.createPlaceForm.value.pricePerNight < 1) {
            invalidFields.push('Precio por noche');
        }
        if (!this.createPlaceForm.value.maxCapacity || this.createPlaceForm.value.maxCapacity < 1) {
            invalidFields.push('Capacidad máxima');
        }
        if (!this.selectedLocation || !this.selectedLocation.latitude || !this.selectedLocation.longitude) {
            invalidFields.push('Ubicación en el mapa');
        }
        if (this.selectedFiles.length === 0) {
            invalidFields.push('Al menos una imagen');
        }

        if (invalidFields.length > 0) {
            console.log(' Campos faltantes:', invalidFields);
            Swal.fire({
                icon: 'warning',
                title: ' Campos incompletos',
                html: `Por favor completa los siguientes campos:<br><br><strong>${invalidFields.join('<br>')}</strong>`,
                confirmButtonText: 'Entendido'
            });
            return;
        }

        //  SUBIR IMÁGENES
        let uploadedUrls: string[] = [];
        try {
            uploadedUrls = await this.uploadImages();
            console.log(' Imágenes subidas:', uploadedUrls);
        } catch (error) {
            console.error(' Error al subir imágenes');
            return;
        }

        const formValue = this.createPlaceForm.value;
        const dto: CreateAccommodationDTO = {
            title: formValue.title.trim(),
            description: formValue.description.trim(),
            city: formValue.city,
            address: formValue.address.trim(),
            latitude: this.selectedLocation!.latitude,
            longitude: this.selectedLocation!.longitude,
            pricePerNight: formValue.pricePerNight,
            maxCapacity: formValue.maxCapacity,
            services: this.services,
            mainImage: uploadedUrls[0],
            images: uploadedUrls
        };

        console.log('DTO a enviar:', dto);

        // ENVIAR AL BACKEND
        this.accommodationService.create(dto).subscribe({
            next: (data: any) => {
                console.log('Respuesta del servidor:', data);
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Alojamiento creado correctamente',
                    confirmButtonText: 'Ver mis alojamientos'
                }).then(() => {
                    this.router.navigate(['/host-properties']);
                });
            },
            error: (error) => {
                console.error('Error del servidor:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.error?.content || error.error?.message || 'No se pudo crear el alojamiento',
                    confirmButtonText: 'Entendido'
                });
            }
        });
    }

    onServiceToggle(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;

        if (input.checked) {
            if (!this.services.includes(value)) {
                this.services.push(value);
            }
        } else {
            this.services = this.services.filter(s => s !== value);
        }

        this.createPlaceForm.get('services')?.setValue(this.services);
        console.log('🔧 Servicios actualizados:', this.services);
    }

    private createImagePreviews(): void {
        this.imagePreviews = [];
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result) {
                    this.imagePreviews[index] = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    getImagePreview(index: number): string {
        return this.imagePreviews[index] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="120"%3E%3Crect fill="%23ddd" width="150" height="120"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
    }

    removeImage(index: number): void {
        console.log(`🗑️ Eliminando imagen ${index + 1}`);
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);

        if (this.selectedFiles.length === 0) {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        }

        console.log(`📸 Imágenes restantes: ${this.selectedFiles.length}`);
    }

    get isFormValid(): boolean {
        const hasBasicFields = this.createPlaceForm.valid;
        const hasLocation = !!this.selectedLocation;
        const hasImages = this.selectedFiles.length > 0;

        return hasBasicFields && hasLocation && hasImages && !this.isUploading;
    }

    ngOnDestroy(): void {
        this.markerSub?.unsubscribe();
        this.mapService.destroyMap();
        this.imagePreviews = [];
    }
}