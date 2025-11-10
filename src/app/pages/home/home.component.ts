import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// (Paso 18) Importar el servicio, DTOs y SweetAlert
import { AccommodationService } from '../../services/accommodation-service';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { SearchAccommodationDTO } from '../../models/search-accommodation-dto.interface';
import Swal from 'sweetalert2';

// Interfaz para los filtros de la UI
interface Filter {
    name: string;
    icon: string;
    active: boolean;
    type: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule]
})
export class HomeComponent implements OnInit, AfterViewInit {
    dropdownOpen = false;
    searchDestination: string = '';

    // Propiedades del Datepicker
    checkinDate: string = '';
    checkoutDate: string = '';
    minDate: string = '';
    minCheckoutDate: string = '';
    dateError: string = '';

    // Propiedades del Slider
    minPrice: number = 50000;
    maxPrice: number = 500000;
    minRange: number = 0;
    maxRange: number = 1000000;
    isDragging: boolean = false;
    activeHandle: 'min' | 'max' | null = null;

    // Propiedades de Paginación
    currentPage: number = 1;
    totalPages: number = 1;

    // Estado de Búsqueda
    isSearchActive: boolean = false;
    lastSearchDTO: SearchAccommodationDTO = {}; // Guarda la última búsqueda

    // Filtros de la UI
    filters: Filter[] = [
        { name: 'Populares', icon: 'fas fa-star', active: true, type: 'popular' },
        { name: 'WiFi', icon: 'fas fa-wifi', active: false, type: 'wifi' },
        { name: 'Piscina', icon: 'fas fa-swimming-pool', active: false, type: 'pool' },
        { name: 'Mascotas', icon: 'fas fa-dog', active: false, type: 'pets' },
        { name: 'Aire Acon.', icon: 'fas fa-snowflake', active: false, type: 'ac' },
        { name: 'Cocina', icon: 'fas fa-utensils', active: false, type: 'kitchen' },
        { name: 'Parking', icon: 'fas fa-parking', active: false, type: 'parking' }
    ];

    // (Paso 18) Arrays vacíos que usan el DTO
    properties: AccommodationDTO[] = [];
    filteredProperties: AccommodationDTO[] = []; // 'filteredProperties' es ahora un alias de 'properties'

    // (Paso 18) Inyectar el servicio
    constructor(private accommodationService: AccommodationService) {}

    // (Paso 18) ngOnInit llama a la API
    ngOnInit(): void {
        this.initializeDates();
        this.loadInitialAccommodations(0); // Cargar página 0
    }

    ngAfterViewInit(): void {
        // Lógica del slider (si es necesaria al inicio)
    }

    /**
     * (Paso 18) Carga los alojamientos iniciales (GET /api/accommodations)
     */
    loadInitialAccommodations(page: number): void {
        this.isSearchActive = false;
        this.accommodationService.getAll(page).subscribe({
            next: (data) => {
                this.properties = data.content.content;
                this.filteredProperties = this.properties;
                this.totalPages = data.content.totalPages;
                this.currentPage = page + 1; // API (0) -> UI (1)
            },
            error: (error) => {
                Swal.fire('Error', error.error.content || "Error al obtener los alojamientos", 'error');
            }
        });
    }

    /**
     * (Paso 18) Ejecuta una búsqueda (POST /api/accommodations/search)
     */
    runSearch(page: number): void {
        this.validateDates();
        if (this.dateError) {
            this.filteredProperties = [];
            return;
        }

        this.isSearchActive = true;

        const activeServices = this.filters
            .filter(f => f.active && f.type !== 'popular')
            .map(f => f.type);

        const searchDTO: SearchAccommodationDTO = {
            city: this.searchDestination || undefined,
            checkIn: this.checkinDate || undefined,
            checkOut: this.checkoutDate || undefined,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            services: activeServices.length > 0 ? activeServices : undefined
        };

        this.lastSearchDTO = searchDTO; // Guardamos la búsqueda

        this.accommodationService.search(page, searchDTO).subscribe({
            next: (data) => {
                this.properties = data.content.content;
                this.filteredProperties = this.properties;
                this.totalPages = data.content.totalPages;
                this.currentPage = page + 1;
            },
            error: (error) => {
                Swal.fire('Error', error.error.content || "Error al buscar alojamientos", 'error');
            }
        });
    }

    // --- MÉTODOS DE EVENTOS (Actualizados para llamar a runSearch) ---

    // Botón principal de búsqueda
    searchProperties(): void {
        this.runSearch(0); // Inicia una nueva búsqueda en la página 0
    }

    // Filtros de íconos
    toggleFilter(filter: Filter): void {
        filter.active = !filter.active;
        this.runSearch(0); // Reinicia la búsqueda con el nuevo filtro
    }

    // Campo de texto de destino (llama a searchProperties)
    onDestinationChange(): void {
        this.searchProperties();
    }

    // Paginación
    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            const targetPage = page - 1; // UI (1) -> API (0)

            if (this.isSearchActive) {
                this.runSearch(targetPage); // Paginar sobre búsqueda
            } else {
                this.loadInitialAccommodations(targetPage); // Paginar sobre "getAll"
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // --- MÉTODOS AUXILIARES (Tus métodos originales) ---

    // (Métodos del Dropdown)
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

    // (Métodos del Datepicker)
    initializeDates(): void {
        const today = new Date();
        this.minDate = this.formatDate(today);
        this.checkinDate = this.minDate;
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.checkoutDate = this.formatDate(tomorrow);
        this.updateMinCheckoutDate();
        this.dateError = '';
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }

    onDateChange(): void {
        this.validateDates();
        if (!this.dateError) {
            this.runSearch(0); // Llama a la búsqueda
        }
    }

    validateDates(): void {
        this.dateError = '';
        if (this.checkinDate && this.checkoutDate) {
            const checkin = new Date(this.checkinDate);
            const checkout = new Date(this.checkoutDate);
            if (checkout < checkin) {
                this.dateError = 'La fecha de salida no puede ser anterior a la fecha de entrada';
                return;
            }
            if (checkin.getTime() === checkout.getTime()) {
                this.dateError = 'La estadía debe ser de al menos una noche';
                return;
            }
            this.updateMinCheckoutDate();
        }
    }

    updateMinCheckoutDate(): void {
        if (this.checkinDate) {
            const checkin = new Date(this.checkinDate);
            const minCheckout = new Date(checkin);
            minCheckout.setDate(minCheckout.getDate() + 1);
            this.minCheckoutDate = this.formatDate(minCheckout);
            if (this.checkoutDate) {
                const checkout = new Date(this.checkoutDate);
                if (checkout <= checkin) {
                    this.checkoutDate = this.minCheckoutDate;
                }
            }
        }
    }

    clearDateError(): void {
        this.dateError = '';
    }

    // (Métodos del Slider)
    getRangeLeft(): string {
        return ((this.minPrice - this.minRange) / (this.maxRange - this.minRange) * 100) + '%';
    }

    getRangeWidth(): string {
        return ((this.maxPrice - this.minPrice) / (this.maxRange - this.minRange) * 100) + '%';
    }

    getHandlePosition(handle: 'min' | 'max'): string {
        const value = handle === 'min' ? this.minPrice : this.maxPrice;
        return ((value - this.minRange) / (this.maxRange - this.minRange) * 100) + '%';
    }

    startDrag(event: MouseEvent, handle: 'min' | 'max'): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
        this.activeHandle = handle;

        const moveHandler = (moveEvent: MouseEvent) => {
            if (this.isDragging && this.activeHandle) {
                this.updateSliderValue(moveEvent);
            }
        };

        const upHandler = () => {
            this.isDragging = false;
            this.activeHandle = null;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            this.runSearch(0); // Llama a la búsqueda al soltar
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }

    onTrackClick(event: MouseEvent): void {
        const track = event.currentTarget as HTMLElement;
        const rect = track.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const value = Math.round(percentage * (this.maxRange - this.minRange) + this.minRange);
        const minDistance = Math.abs(value - this.minPrice);
        const maxDistance = Math.abs(value - this.maxPrice);
        if (minDistance < maxDistance) {
            this.minPrice = Math.min(value, this.maxPrice - 10000);
        } else {
            this.maxPrice = Math.max(value, this.minPrice + 10000);
        }
        this.runSearch(0); // Llama a la búsqueda al hacer clic
    }

    updateSliderValue(event: MouseEvent): void {
        const track = document.querySelector('.slider-track') as HTMLElement;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const percentage = x / rect.width;
        const value = Math.round(percentage * (this.maxRange - this.minRange) + this.minRange);
        if (this.activeHandle === 'min') {
            this.minPrice = Math.max(this.minRange, Math.min(value, this.maxPrice - 10000));
        } else if (this.activeHandle === 'max') {
            this.maxPrice = Math.min(this.maxRange, Math.max(value, this.minPrice + 10000));
        }
    }

    // (Método de Paginación)
    getPages(): number[] {
        const pages: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }
}