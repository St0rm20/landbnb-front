import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapService, LocationDTO } from '../../services/map-service';

@Component({
    selector: 'app-create-place',
    templateUrl: './create-place.component.html',
    styleUrls: ['./create-place.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class CreatePlaceComponent implements AfterViewInit, OnDestroy {
    createPlaceForm: FormGroup;

    citiesList = [
        'Armenia',
        'Pereira',
        'Manizales',
        'Medellín',
        'Bogotá',
        'Cali',
        'Cartagena',
        'Barranquilla',
        'Bucaramanga',
        'Cúcuta',
        'Ibagué',
        'Villavicencio',
        'Santa Marta',
        'Montería',
        'Valledupar',
        'Popayán',
        'Sincelejo',
        'Tunja',
        'Riohacha',
        'Quibdó'
    ];

    servicesList = ['WiFi', 'Piscina', 'Cocina', 'Mascotas', 'Aire Acondicionado', 'Parking'];
    services: string[] = [];
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    selectedLocation: LocationDTO | null = null;
    dropdownOpen = false;
    private markerSub?: Subscription;

    constructor(
        private fb: FormBuilder,
        private mapService: MapService
    ) {
        this.createPlaceForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            price: [null, [Validators.required, Validators.min(1)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            city: ['', Validators.required], // 🔥 Ahora será un select
            capacity: [1, [Validators.required, Validators.min(1)]],
            images: [null],
            services: [[]],
            location: [null, Validators.required]
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.initializeMap(), 100);
    }

    private async initializeMap(): Promise<void> {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                alert('Error: No se pudo encontrar el contenedor del mapa');
                return;
            }

            const defaultCenter: [number, number] = [-75.6811, 4.5370]; // Armenia por defecto
            const zoom = 13;
            await this.mapService.initializeMap('map', defaultCenter, zoom);

            this.markerSub = this.mapService.addMarkerOnClick().subscribe({
                next: (coords) => {
                    this.selectedLocation = { latitude: coords.lat, longitude: coords.lng };
                    this.createPlaceForm.patchValue({ location: this.selectedLocation });
                },
                error: (err) => {
                    console.error('Error al seleccionar ubicación:', err);
                    alert('Error al seleccionar ubicación en el mapa');
                }
            });
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
            alert('Error al cargar el mapa. Por favor recarga la página.');
        }
    }

    toggleDropdown(event: Event): void {
        event.preventDefault();
        this.dropdownOpen = !this.dropdownOpen;
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

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const files = Array.from(input.files);
        if (files.length > 10) {
            alert('Máximo 10 imágenes permitidas.');
            input.value = '';
            return;
        }

        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            alert('Solo se permiten archivos de imagen.');
            input.value = '';
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        const oversizedFiles = validFiles.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            alert(`Algunas imágenes superan el tamaño máximo de 5MB:\n${oversizedFiles.map(f => f.name).join('\n')}`);
            input.value = '';
            return;
        }

        this.selectedFiles = validFiles;
        this.createPlaceForm.get('images')?.setValue(this.selectedFiles);
        this.createImagePreviews();
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

    onSubmit(): void {
        if (this.createPlaceForm.invalid) {
            this.createPlaceForm.markAllAsTouched();
            const invalidFields = Object.keys(this.createPlaceForm.controls).filter(
                key => this.createPlaceForm.get(key)?.invalid
            );
            alert(`Por favor completa los siguientes campos: ${invalidFields.join(', ')}`);
            return;
        }

        if (!this.selectedLocation) {
            alert('Selecciona una ubicación en el mapa.');
            return;
        }

        if (this.selectedFiles.length === 0) {
            alert('Selecciona al menos una imagen.');
            return;
        }

        const payload = {
            title: this.createPlaceForm.value.title,
            price: this.createPlaceForm.value.price,
            description: this.createPlaceForm.value.description,
            city: this.createPlaceForm.value.city,
            capacity: this.createPlaceForm.value.capacity,
            services: this.services,
            location: this.selectedLocation,
            imageCount: this.selectedFiles.length,
            imageNames: this.selectedFiles.map(f => f.name),
            imageSizes: this.selectedFiles.map(f => `${(f.size / 1024).toFixed(2)} KB`)
        };

        console.log('Alojamiento creado:', payload);
        alert('Alojamiento creado exitosamente.');
    }

    ngOnDestroy(): void {
        this.markerSub?.unsubscribe();
        this.mapService.destroyMap();
        this.imagePreviews = [];
    }
}