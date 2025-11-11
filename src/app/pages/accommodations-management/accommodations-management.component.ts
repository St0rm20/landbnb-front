import { Component, AfterViewInit, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
// Asumo que tu MapService emite { lat, lng }
import { MapService, LocationDTO } from '../../services/map-service';
import Swal from 'sweetalert2';

// DTOs
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import {UserDto} from "../../models/user-dto.interface";
import { ImageService } from '../../services/image-service';
import { AccommodationService } from '../../services/accommodation-service.service';
import { UpdateAccommodationDTO } from '../../models/update-accommodation-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { ResponseDTO } from '../../models/response-dto.interface';

// Interfaz LngLat para el tipo emitido por el mapa (si tu MapService no la exporta)
interface LngLat {
    lat: number;
    lng: number;
}
// Interfaz MarkerDTO (Asumimos que está importada o definida en tu proyecto)
interface MarkerDTO {
    id: number;
    location: LocationDTO;
    title: string;
    photoUrl: string;
}


@Component({
    selector: 'app-accommodations-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './accommodations-management.component.html',
    styleUrls: ['./accommodations-management.component.css']
})
export class AccommodationsManagementComponent implements OnInit, AfterViewInit, OnDestroy {

    editAccommodationForm: FormGroup;

    citiesList = [
        'Armenia', 'Pereira', 'Manizales', 'Medellín', 'Bogotá', 'Cali', 'Cartagena',
        'Barranquilla', 'Bucaramanga', 'Cúcuta', 'Ibagué', 'Villavicencio',
        'Santa Marta', 'Montería', 'Valledupar', 'Popayán', 'Sincelejo', 'Tunja',
        'Riohacha', 'Quibdó'
    ];
    servicesList = ['WiFi', 'Piscina', 'Cocina', 'Mascotas', 'Aire Acondicionado', 'Parking'];

    services: string[] = [];
    existingImageUrls: string[] = [];
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];

    selectedLocation: LocationDTO | null = null;
    private markerSub?: Subscription;
    isUploading: boolean = false;

    accommodationId: number | null = null;
    isLoading: boolean = true;

    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    constructor(
        private fb: FormBuilder,
        private mapService: MapService,
        private router: Router,
        private route: ActivatedRoute,
        private tokenService: TokenService,
        private userService: UserService,
        private imageService: ImageService,
        private accommodationService: AccommodationService
    ) {

        this.editAccommodationForm = this.fb.group({
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
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.router.navigate(['/login']);
        }

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.accommodationId = +idParam;
            this.loadAccommodationData(this.accommodationId);
        } else {
            Swal.fire('Error', 'No se encontró el ID del alojamiento', 'error');
            this.router.navigate(['/host-properties']);
        }
    }

    ngAfterViewInit(): void {}

    /**
     * Llama a la API para obtener los datos del alojamiento
     */
    loadAccommodationData(id: number): void {
        this.isLoading = true;
        this.accommodationService.getById(id).subscribe({
            next: (data: ResponseDTO) => {
                const acc = data.content as AccommodationDTO;

                if (!acc) {
                    this.isLoading = false;
                    Swal.fire('Error', 'No se pudieron cargar los datos del alojamiento (contenido vacío).', 'error');
                    this.router.navigate(['/host-properties']);
                    return;
                }

                this.editAccommodationForm.patchValue({
                    title: acc.title,
                    description: acc.description,
                    city: acc.city,
                    address: acc.address,
                    latitude: acc.latitude,
                    longitude: acc.longitude,
                    pricePerNight: acc.pricePerNight,
                    maxCapacity: acc.maxCapacity,
                    mainImage: acc.mainImage,
                    images: acc.images,
                    services: acc.services
                });

                this.services = acc.services || [];
                this.existingImageUrls = acc.images || [];
                this.selectedLocation = {
                    latitude: acc.latitude,
                    longitude: acc.longitude
                };

                this.initializeMap(); // 👈 Llamada al mapa
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', 'No se pudieron cargar los datos del alojamiento', 'error');
                this.router.navigate(['/host-properties']);
            }
        });
    }

    /**
     * Lógica de 'onSubmit' para ACTUALIZAR
     */
    async onSubmit(): Promise<void> {
        this.editAccommodationForm.markAllAsTouched();

        if (this.editAccommodationForm.invalid) {
            Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'warning');
            return;
        }

        let newUploadedUrls: string[] = [];
        if (this.selectedFiles.length > 0) {
            try {
                newUploadedUrls = await this.uploadImages();
            } catch (error) {
                return;
            }
        }

        const allImages = [...this.existingImageUrls, ...newUploadedUrls];
        const formValue = this.editAccommodationForm.value;

        const dto: UpdateAccommodationDTO = {
            title: formValue.title,
            description: formValue.description,
            city: formValue.city,
            address: formValue.address,
            latitude: formValue.latitude,
            longitude: formValue.longitude,
            pricePerNight: formValue.pricePerNight,
            maxCapacity: formValue.maxCapacity,
            services: this.services,
            mainImage: allImages[0],
            images: allImages
        };

        this.accommodationService.update(this.accommodationId!, dto).subscribe({
            next: (data: any) => {
                Swal.fire('¡Éxito!', 'Alojamiento actualizado correctamente', 'success');
                this.router.navigate(['/host-properties']);
            },
            error: (error) => {
                Swal.fire('Error', error.error.content || 'No se pudo actualizar el alojamiento', 'error');
            }
        });
    }


    // --- (Funciones del Navbar y Auxiliares) ---
    private async initializeMap(): Promise<void> {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) { return; }

            const center: [number, number] = this.selectedLocation
                ? [this.selectedLocation.longitude, this.selectedLocation.latitude]
                : [-75.6811, 4.5370];

            await this.mapService.initializeMap('map', center, 13);

            if (this.selectedLocation) {
                // 1. CORRECCIÓN: Creamos el MarkerDTO temporal
                const markerData: MarkerDTO = {
                    id: this.accommodationId || 0,
                    location: this.selectedLocation,
                    title: this.editAccommodationForm.value.title || 'Ubicación actual',
                    photoUrl: this.existingImageUrls[0] || 'default.jpg'
                };
                this.mapService.addMarker(markerData); // 👈 Pasamos el MarkerDTO completo
            }

            // 2. Suscribirse a clics (Usa LngLat y convierte)
            this.markerSub = this.mapService.addMarkerOnClick().subscribe({
                next: (coords: LngLat) => {
                    this.selectedLocation = {
                        latitude: coords.lat,
                        longitude: coords.lng
                    };
                    this.editAccommodationForm.patchValue({
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

    // (Omito el resto de funciones auxiliares por espacio, pero se mantienen igual)
    loadUserProfile(): void { this.userService.getProfile().subscribe({ next: (data: UserDto) => { this.userName = data.name; }, error: (error: any) => { console.error("Error cargando perfil", error); } }); }
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void { const target = event.target as HTMLElement; if (!target.closest('.dropdown')) { this.dropdownOpen = false; } }
    toggleDropdown(event: Event): void { event.preventDefault(); event.stopPropagation(); this.dropdownOpen = !this.dropdownOpen; }
    logout(event: Event): void { event.preventDefault(); this.tokenService.logout(); this.router.navigate(['/login']).then(() => window.location.reload()); }
    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        this.selectedFiles = Array.from(input.files);
        if (this.selectedFiles.length + this.existingImageUrls.length > 10) {
            Swal.fire('Error', 'Máximo 10 imágenes permitidas en total.', 'warning');
            this.selectedFiles = [];
            return;
        }
        this.createImagePreviews();
    }
    async uploadImages(): Promise<string[]> {
        this.isUploading = true;
        Swal.fire({ title: 'Subiendo imágenes...', text: `0 de ${this.selectedFiles.length} completadas.`, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
        const uploadedUrls: string[] = [];
        let completed = 0;
        for (const file of this.selectedFiles) {
            try {
                const data = await firstValueFrom(this.imageService.upload(file));
                uploadedUrls.push(data.content.url);
                completed++;
                Swal.update({ text: `${completed} de ${this.selectedFiles.length} completadas.` });
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
    onServiceToggle(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        if (input.checked) {
            if (!this.services.includes(value)) this.services.push(value);
        } else {
            this.services = this.services.filter(s => s !== value);
        }
        this.editAccommodationForm.get('services')?.setValue(this.services);
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
        return this.imagePreviews[index];
    }
    removeExistingImage(index: number): void {
        this.existingImageUrls.splice(index, 1);
        this.editAccommodationForm.get('images')?.setValue(this.existingImageUrls);
    }
    removeNewImage(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }
    ngOnDestroy(): void {
        this.markerSub?.unsubscribe();
        try {
            this.mapService.destroyMap();
        } catch (e) {
            console.warn("Error al destruir el mapa, probablemente ya estaba inactivo.", e);
        }
        this.imagePreviews = [];
        this.existingImageUrls = [];
    }
}