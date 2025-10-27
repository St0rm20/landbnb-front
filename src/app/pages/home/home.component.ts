import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Property {
    id: number;
    title: string;
    description: string;
    price: number;
    rating: number;
    image: string;
    features: string[];
    available?: boolean; // Agregar propiedad para disponibilidad
}

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

    // Datepicker properties
    checkinDate: string = '';
    checkoutDate: string = '';
    minDate: string = '';
    minCheckoutDate: string = '';

    // Mensajes de error para fechas
    dateError: string = '';

    minPrice: number = 50000;
    maxPrice: number = 500000;
    minRange: number = 0;
    maxRange: number = 1000000;

    // Slider state
    isDragging: boolean = false;
    activeHandle: 'min' | 'max' | null = null;

    currentPage: number = 1;
    itemsPerPage: number = 8;
    totalPages: number = 1;

    filters: Filter[] = [
        { name: 'Populares', icon: 'fas fa-star', active: true, type: 'popular' },
        { name: 'WiFi', icon: 'fas fa-wifi', active: false, type: 'wifi' },
        { name: 'Piscina', icon: 'fas fa-swimming-pool', active: false, type: 'pool' },
        { name: 'Mascotas', icon: 'fas fa-dog', active: false, type: 'pets' },
        { name: 'Aire Acon.', icon: 'fas fa-snowflake', active: false, type: 'ac' },
        { name: 'Cocina', icon: 'fas fa-utensils', active: false, type: 'kitchen' },
        { name: 'Parking', icon: 'fas fa-parking', active: false, type: 'parking' }
    ];

    properties: Property[] = [
        {
            id: 1,
            title: 'Salento, Quindío',
            description: 'A 5km del centro',
            price: 150000,
            rating: 4.85,
            image: 'assets/imagenes/Hostal1.jpg.webp',
            features: ['wifi', 'pool', 'parking'],
            available: true
        },
        {
            id: 2,
            title: 'Cartagena, Bolívar',
            description: 'En la ciudad amurallada',
            price: 220000,
            rating: 4.92,
            image: 'assets/imagenes/hostal2.jpg.avif',
            features: ['wifi', 'ac', 'kitchen'],
            available: true
        },
        {
            id: 3,
            title: 'Medellín, Antioquia',
            description: 'Cerca al Parque Lleras',
            price: 180000,
            rating: 5.0,
            image: 'assets/imagenes/hostal3.jpg',
            features: ['wifi', 'pool', 'ac', 'parking'],
            available: true
        },
        {
            id: 4,
            title: 'Bogotá, Cundinamarca',
            description: 'Vista a la ciudad',
            price: 165000,
            rating: 4.78,
            image: 'assets/imagenes/hostal4.jpg',
            features: ['wifi', 'kitchen', 'parking'],
            available: true
        },
        {
            id: 5,
            title: 'Casa con todas las comodidades',
            description: 'Casa completa en la naturaleza',
            price: 300000,
            rating: 4.95,
            image: 'assets/imagenes/Hostal1.jpg.webp',
            features: ['wifi', 'pool', 'ac', 'kitchen', 'parking', 'pets'],
            available: true
        }
    ];

    filteredProperties: Property[] = [];

    ngOnInit(): void {
        this.initializeDates();
        this.filteredProperties = [...this.properties];
        this.calculateTotalPages();
    }

    ngAfterViewInit(): void {
        // No necesitamos inicializar nada externo
    }

    // Datepicker Methods
    initializeDates(): void {
        const today = new Date();
        this.minDate = this.formatDate(today);

        // Set default check-in to today
        this.checkinDate = this.minDate;

        // Set default check-out to tomorrow
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
            this.applyFilters();
        }
    }

    validateDates(): void {
        this.dateError = '';

        if (this.checkinDate && this.checkoutDate) {
            const checkin = new Date(this.checkinDate);
            const checkout = new Date(this.checkoutDate);

            // Validar que check-out no sea antes de check-in
            if (checkout < checkin) {
                this.dateError = 'La fecha de salida no puede ser anterior a la fecha de entrada';
                return;
            }

            // Validar que no sea la misma fecha
            if (checkin.getTime() === checkout.getTime()) {
                this.dateError = 'La estadía debe ser de al menos una noche';
                return;
            }

            // Actualizar fecha mínima de check-out
            this.updateMinCheckoutDate();
        }
    }

    updateMinCheckoutDate(): void {
        if (this.checkinDate) {
            const checkin = new Date(this.checkinDate);
            const minCheckout = new Date(checkin);
            minCheckout.setDate(minCheckout.getDate() + 1);
            this.minCheckoutDate = this.formatDate(minCheckout);

            // Ajustar checkout date si es inválida
            if (this.checkoutDate) {
                const checkout = new Date(this.checkoutDate);
                if (checkout <= checkin) {
                    this.checkoutDate = this.minCheckoutDate;
                }
            }
        }
    }

    // Slider Methods
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
            this.applyFilters();
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

        this.applyFilters();
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

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    toggleDropdown(event: Event): void {
        event.preventDefault();
        this.dropdownOpen = !this.dropdownOpen;
    }

    onDestinationChange(): void {
        this.applyFilters();
    }

    toggleFilter(filter: Filter): void {
        filter.active = !filter.active;
        this.applyFilters();
    }

    applyFilters(): void {
        // Validar fechas primero
        this.validateDates();
        if (this.dateError) {
            // Si hay error en fechas, no aplicar filtros o mostrar propiedades limitadas
            this.filteredProperties = [];
            this.calculateTotalPages();
            return;
        }

        let filtered = [...this.properties];

        // Filtrar por destino (OR dentro del mismo campo)
        if (this.searchDestination) {
            const searchTerms = this.searchDestination.toLowerCase().split(' ');
            filtered = filtered.filter(p =>
                searchTerms.some(term =>
                    p.title.toLowerCase().includes(term) ||
                    p.description.toLowerCase().includes(term)
                )
            );
        }

        // Filtrar por precio
        filtered = filtered.filter(p =>
            p.price >= this.minPrice && p.price <= this.maxPrice
        );

        // Filtrar por características activas (AND entre diferentes características)
        const activeFilters = this.filters
            .filter(f => f.active && f.type !== 'popular')
            .map(f => f.type);

        if (activeFilters.length > 0) {
            // CAMBIO CLAVE: Usar AND en lugar de OR
            // Solo mostrar propiedades que tengan TODAS las características activas
            filtered = filtered.filter(p =>
                activeFilters.every(af => p.features.includes(af))
            );
        }

        // Filtrar por "Populares" (rating alto)
        const popularFilter = this.filters.find(f => f.type === 'popular');
        if (popularFilter?.active) {
            filtered = filtered.filter(p => p.rating >= 4.8);
        }

        this.filteredProperties = filtered;
        this.currentPage = 1;
        this.calculateTotalPages();
    }

    searchProperties(): void {
        this.applyFilters();
    }

    calculateTotalPages(): void {
        this.totalPages = Math.ceil(this.filteredProperties.length / this.itemsPerPage);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    getPages(): number[] {
        const pages: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Método para limpiar errores de fecha
    clearDateError(): void {
        this.dateError = '';
    }
}