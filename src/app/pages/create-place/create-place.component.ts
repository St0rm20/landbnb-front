import { Component, AfterViewInit, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { MapService, LocationDTO } from '../../services/map-service'; // (Tu servicio de mapa)
import Swal from 'sweetalert2';

// 1. --- IMPORTAR LOS SERVICIOS Y DTOS REALES ---
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import { ImageService } from '../../services/image-service';
import { AccommodationService } from '../../services/accommodation-service.service';
import { CreateAccommodationDTO } from '../../models/create-accommodation-dto.interface'; // 👈 (Asumiendo que ya renombraste el archivo a .ts)
import { ResponseDTO } from '../../models/response-dto.interface'; // 👈 (Asumiendo que ya renombraste el archivo a .ts)

@Component({
    selector: 'app-create-place',
    templateUrl: './create-place.component.html',
    styleUrls: ['./create-place.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class CreatePlaceComponent implements OnInit, AfterViewInit, OnDestroy {
    createPlaceForm: FormGroup;

    // --- Listas de datos (Quemadas) ---
    citiesList = [
        'Armenia', 'Pereira', 'Manizales', 'Medellín', 'Bogotá', 'Cali', 'Cartagena',
        'Barranquilla', 'Bucaramanga', 'Cúcuta', 'Ibagué', 'Villavicencio',
        'Santa Marta', 'Montería', 'Valledupar', 'Popayán', 'Sincelejo', 'Tunja',
        'Riohacha', 'Quibdó'
    ];
    servicesList = ['WiFi', 'Piscina', 'Cocina', 'Mascotas', 'Aire Acondicionado', 'Parking'];

    // --- Lógica del formulario ---
    services: string[] = [];
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    selectedLocation: LocationDTO | null = null;
    private markerSub?: Subscription;
    isUploading: boolean = false;

    // --- PROPIEDADES DEL NAVBAR (¡AHORA SÍ ESTÁN!) ---
    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    constructor(
        private fb: FormBuilder,
        private mapService: MapService,
        private router: Router,
        private tokenService: TokenService,
        private userService: UserService,
        private imageService: ImageService,
        private accommodationService: AccommodationService
        // ❌ (Servicios falsos eliminados)
    ) {

        // --- Formulario Corregido ---
        this.createPlaceForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            pricePerNight: [null, [Validators.required, Validators.min(1)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            city: ['', Validators.required],
            address: ['', Validators.required],
            maxCapacity: [1, [Validators.required, Validators.min(1)]],
            latitude: [null, Validators.required],
            longitude: [null, Validators.required],
            mainImage: [''],
            images: [[]],
            services: [[]]
        });
    }

    ngOnInit(): void {
        // --- Cargar datos del Navbar ---
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.router.navigate(['/login']);
        }

        // (Ya no necesitamos llamar a loadCities/loadServices)
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.initializeMap(), 100);
    }

    // --- MÉTODOS DEL NAVBAR (¡AHORA SÍ ESTÁN!) ---
    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => { this.userName = data.name; },
            error: (error: any) => { console.error("Error cargando perfil", error); }
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) { this.dropdownOpen = false; }
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

    // --- LÓGICA DE SUBIDA Y CREACIÓN ---

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        this.selectedFiles = Array.from(input.files);
        if (this.selectedFiles.length > 10) {
            Swal.fire('Error', 'Máximo 10 imágenes permitidas.', 'warning');
            this.selectedFiles = [];
            return;
        }
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
            } catch (error) {
                console.error("Error subiendo imagen:", error);
                this.isUploading = false;
                Swal.fire('Error', 'No se pudo subir una de las imágenes', 'error');
                throw error;
            }
        }

        this.isUploading = false;
        return uploadedUrls;
    }

    async onSubmit(): Promise<void> {
        this.createPlaceForm.markAllAsTouched();

        if (this.createPlaceForm.invalid) {
            // Log para depurar por qué el botón está deshabilitado
            console.log("Formulario Inválido. Revisando campos:");
            Object.keys(this.createPlaceForm.controls).forEach(key => {
                const control = this.createPlaceForm.get(key);
                if (control?.invalid) {
                    console.log(`❌ Campo [${key}] es inválido. Errores:`, control.errors);
                }
            });

            Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'warning');
            return;
        }
        if (this.selectedFiles.length === 0) {
            Swal.fire('Error', 'Debes subir al menos una imagen.', 'warning');
            return;
        }

        let uploadedUrls: string[] = [];
        try {
            uploadedUrls = await this.uploadImages();
        } catch (error) {
            return;
        }

        const formValue = this.createPlaceForm.value;
        const dto: CreateAccommodationDTO = {
            title: formValue.title,
            description: formValue.description,
            city: formValue.city,
            address: formValue.address,
            latitude: formValue.latitude,
            longitude: formValue.longitude,
            pricePerNight: formValue.pricePerNight,
            maxCapacity: formValue.maxCapacity,
            services: this.services,
            mainImage: uploadedUrls[0],
            images: uploadedUrls
        };

        this.accommodationService.create(dto).subscribe({
            next: (data: any) => {
                Swal.fire('¡Éxito!', 'Alojamiento creado correctamente', 'success');
                this.router.navigate(['/host-properties']);
            },
            error: (error) => {
                Swal.fire('Error', error.error.content || 'No se pudo crear el alojamiento', 'error');
            }
        });
    }

    // --- MÉTODOS AUXILIARES ---

    private async initializeMap(): Promise<void> {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) { return; }
            const defaultCenter: [number, number] = [-75.6811, 4.5370];
            const zoom = 13;
            await this.mapService.initializeMap('map', defaultCenter, zoom);
            this.markerSub = this.mapService.addMarkerOnClick().subscribe({
                next: (coords) => {
                    this.selectedLocation = { latitude: coords.lat, longitude: coords.lng };
                    this.createPlaceForm.patchValue({
                        latitude: coords.lat,
                        longitude: coords.lng
                    });
                },
                error: (err) => { console.error('Error al seleccionar ubicación:', err); }
            });
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
        }
    }

    onServiceToggle(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        if (input.checked) {
            if (!this.services.includes(value)) this.services.push(value);
        } else {
            this.services = this.services.filter(s => s !== value);
        }
        this.createPlaceForm.get('services')?.setValue(this.services);
    }

    private createImagePreviews(): void {
        this.imagePreviews = [];
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result) this.imagePreviews[index] = e.target.result as string;
            };
            reader.readAsDataURL(file);
        });
    }

    getImagePreview(index: number): string {
        return this.imagePreviews[index] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="120" viewBox="0 0 150 120"%3E%3Crect fill="%23ddd" width="150" height="120"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
    }

    removeImage(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
        this.createPlaceForm.get('images')?.setValue(this.selectedFiles.length > 0 ? this.selectedFiles : null);
        if (this.selectedFiles.length === 0) {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    }

    ngOnDestroy(): void {
        this.markerSub?.unsubscribe();
        this.mapService.destroyMap();
        this.imagePreviews = [];
    }
}