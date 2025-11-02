import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { MapService, LocationDTO } from '../../services/map-service';

export interface AccommodationDTO {
    id: number;
    title: string;
    price: number;
    description: string;
    city: string;
    capacity: number;
    services: string[];
    location: LocationDTO;
    images: string[];
}

@Component({
    selector: 'app-accommodation-management',
    templateUrl: './accommodation-management.component.html',
    styleUrls: ['./accommodation-management.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class AccommodationManagementComponent implements AfterViewInit, OnDestroy {

    accommodations: AccommodationDTO[] = []; // Lista de alojamientos
    selectedAccommodation: AccommodationDTO | null = null;
    editForm: FormGroup;
    servicesList = ['WiFi', 'Piscina', 'Cocina', 'Mascotas', 'Aire Acondicionado', 'Parking'];
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    selectedLocation: LocationDTO | null = null;
    private markerSub?: Subscription;

    constructor(private fb: FormBuilder, private mapService: MapService) {
        this.editForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            price: [null, [Validators.required, Validators.min(1)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            city: ['', Validators.required],
            capacity: [1, [Validators.required, Validators.min(1)]],
            services: [[]],
            location: [null, Validators.required],
            images: [null]
        });
    }

    ngAfterViewInit(): void {
        // Inicializar mapa solo si se selecciona un alojamiento para editar
        if (this.selectedAccommodation) {
            setTimeout(() => this.initializeMap(), 100);
        }
    }

    selectAccommodation(acc: AccommodationDTO): void {
        this.selectedAccommodation = acc;
        this.selectedFiles = [];
        this.imagePreviews = [];
        this.selectedLocation = acc.location;
        this.editForm.patchValue({
            title: acc.title,
            price: acc.price,
            description: acc.description,
            city: acc.city,
            capacity: acc.capacity,
            services: acc.services,
            location: acc.location,
            images: null
        });
        setTimeout(() => this.initializeMap(), 100);
    }

    initializeMap(): void {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        const center: [number, number] = [
            this.selectedLocation?.longitude ?? -75.6811,
            this.selectedLocation?.latitude ?? 4.5370
        ];
        this.mapService.initializeMap('map', center, 13).then(() => {
            this.markerSub = this.mapService.addMarkerOnClick().subscribe(coords => {
                this.selectedLocation = { latitude: coords.lat, longitude: coords.lng };
                this.editForm.patchValue({ location: this.selectedLocation });
            });
        });
    }

    onServiceToggle(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value;
        let services = this.editForm.get('services')?.value || [];

        if (input.checked) {
            if (!services.includes(value)) services.push(value);
        } else {
            services = services.filter((s: string) => s !== value);
        }
        this.editForm.get('services')?.setValue(services);
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        const files = Array.from(input.files);
        if (files.length > 10) {
            alert('Máximo 10 imágenes permitidas.');
            input.value = '';
            return;
        }

        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            alert('Solo se permiten archivos de imagen.');
            input.value = '';
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        const oversizedFiles = validFiles.filter(f => f.size > maxSize);
        if (oversizedFiles.length > 0) {
            alert(`Algunas imágenes superan 5MB:\n${oversizedFiles.map(f => f.name).join('\n')}`);
            input.value = '';
            return;
        }

        this.selectedFiles = validFiles;
        this.editForm.get('images')?.setValue(this.selectedFiles);
        this.createImagePreviews();
    }

    private createImagePreviews(): void {
        this.imagePreviews = [];
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                if (e.target?.result) this.imagePreviews[index] = e.target.result as string;
            };
            reader.readAsDataURL(file);
        });
    }

    getImagePreview(index: number): string {
        return this.imagePreviews[index] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="120"%3E%3Crect fill="%23ddd" width="150" height="120"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ECargando...%3C/text%3E%3C/svg%3E';
    }

    removeImage(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
        this.editForm.get('images')?.setValue(this.selectedFiles.length ? this.selectedFiles : null);
    }

    saveChanges(): void {
        if (!this.selectedAccommodation) return;

        if (this.editForm.invalid) {
            this.editForm.markAllAsTouched();
            alert('Por favor completa todos los campos requeridos.');
            return;
        }

        const updated = {
            ...this.selectedAccommodation,
            ...this.editForm.value,
            location: this.selectedLocation,
            images: this.selectedFiles.length ? this.selectedFiles.map(f => f.name) : this.selectedAccommodation.images
        };

        // Aquí podrías hacer un llamado a API para actualizar
        console.log('Alojamiento actualizado:', updated);
        alert('Alojamiento actualizado correctamente.');
    }

    removeAccommodation(acc: AccommodationDTO): void {
        if (confirm(`¿Deseas eliminar "${acc.title}"?`)) {
            this.accommodations = this.accommodations.filter(a => a.id !== acc.id);
            if (this.selectedAccommodation?.id === acc.id) this.selectedAccommodation = null;
            alert('Alojamiento eliminado.');
        }
    }

    ngOnDestroy(): void {
        this.markerSub?.unsubscribe();
        this.mapService.destroyMap();
    }
}
