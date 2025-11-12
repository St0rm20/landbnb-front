import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// Servicios y DTOs
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import {UserDto} from '../../models/user-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { SearchAccommodationDTO } from '../../models/search-accommodation-dto.interface';
import { ResponseDTO } from '../../models/response-dto.interface';
import Swal from 'sweetalert2';

interface Filter {
    name: string;
    icon: string;
    active: boolean;
    type: string;
    serviceName: string; // 👈 Nombre exacto del servicio que buscará
}

interface PagedResponse {
    content: AccommodationDTO[];
    totalPages: number;
}

interface AccommodationSimpleDto {
    id: number;
    title: string;
    description: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    maxCapacity: number;
    services: string[];
    url: string;
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
    checkinDate: string = '';
    checkoutDate: string = '';
    minDate: string = '';
    minCheckoutDate: string = '';
    dateError: string = '';
    minPrice: number = 50000;
    maxPrice: number = 500000;
    minRange: number = 0;
    maxRange: number = 1000000;
    isDragging: boolean = false;
    activeHandle: 'min' | 'max' | null = null;
    currentPage: number = 1;
    totalPages: number = 1;
    isSearchActive: boolean = false;
    isFavoritesActive: boolean = false;
    lastSearchDTO: SearchAccommodationDTO = {};
    numberOfGuests: number = 1;

    // 👇 FILTROS CON NOMBRES EXACTOS EN ESPAÑOL
    filters: Filter[] = [
        { name: 'Favoritos', icon: 'fas fa-heart', active: false, type: 'favorites', serviceName: '' },
        { name: 'WiFi', icon: 'fas fa-wifi', active: false, type: 'service', serviceName: 'WiFi' },
        { name: 'Piscina', icon: 'fas fa-swimming-pool', active: false, type: 'service', serviceName: 'Piscina' },
        { name: 'Mascotas', icon: 'fas fa-dog', active: false, type: 'service', serviceName: 'Mascotas' },
        { name: 'Aire Acon.', icon: 'fas fa-snowflake', active: false, type: 'service', serviceName: 'Aire Acondicionado' },
        { name: 'Cocina', icon: 'fas fa-utensils', active: false, type: 'service', serviceName: 'Cocina' },
        { name: 'Parking', icon: 'fas fa-parking', active: false, type: 'service', serviceName: 'Parking' }
    ];

    properties: AccommodationDTO[] = [];
    filteredProperties: AccommodationDTO[] = [];
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    constructor(
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private userService: UserService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initializeDates();
        this.loadInitialAccommodations(0);
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        }
    }

    ngAfterViewInit(): void { }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => { this.userName = data.name; },
            error: (error: any) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = '';
            }
        });
    }

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    loadInitialAccommodations(page: number): void {
        this.isSearchActive = false;
        this.isFavoritesActive = false;
        this.accommodationService.getAll(page).subscribe({
            next: (data: any) => {
                this.properties = (data.content || []).map((simpleDto: AccommodationSimpleDto) => {
                    return {
                        id: simpleDto.id,
                        title: simpleDto.title,
                        description: simpleDto.description,
                        city: simpleDto.city,
                        address: simpleDto.address,
                        latitude: simpleDto.latitude,
                        longitude: simpleDto.longitude,
                        pricePerNight: simpleDto.pricePerNight,
                        maxCapacity: simpleDto.maxCapacity,
                        services: simpleDto.services,
                        mainImage: simpleDto.url,
                        images: [simpleDto.url],
                        averageRating: 0,
                        totalBookings: 0
                    };
                });

                this.filteredProperties = this.properties;
                this.totalPages = data?.totalPages || 1;
                this.currentPage = page + 1;
            },
            error: (error: any) => {
                this.properties = [];
                this.filteredProperties = [];
                Swal.fire('Error', error.error.content || "Error al obtener los alojamientos", 'error');
            }
        });
    }

    loadFavorites(page: number): void {
        this.isSearchActive = true;
        this.isFavoritesActive = true;

        this.accommodationService.getFavoriteAccommodations(page).subscribe({
            next: (data: any) => {
                this.properties = (data.content || []).map((simpleDto: AccommodationSimpleDto) => ({
                    id: simpleDto.id,
                    title: simpleDto.title,
                    description: simpleDto.description,
                    city: simpleDto.city,
                    address: simpleDto.address,
                    latitude: simpleDto.latitude,
                    longitude: simpleDto.longitude,
                    pricePerNight: simpleDto.pricePerNight,
                    maxCapacity: simpleDto.maxCapacity,
                    services: simpleDto.services,
                    mainImage: simpleDto.url,
                    images: [simpleDto.url],
                    averageRating: 0,
                    totalBookings: 0
                }));

                this.filteredProperties = this.properties;
                this.totalPages = data?.totalPages || 1;
                this.currentPage = page + 1;
            },
            error: (err) => {
                this.properties = [];
                this.filteredProperties = [];
                Swal.fire('Error', 'No se pudieron cargar tus favoritos', 'error');
            }
        });
    }

    /**
     * 👇 BÚSQUEDA: Primero busca en el backend, luego filtra localmente por servicios en español
     */
    runSearch(page: number): void {
        this.validateDates();
        if (this.dateError) {
            this.filteredProperties = [];
            return;
        }

        this.isSearchActive = true;
        this.isFavoritesActive = false;

        // Construir DTO básico sin servicios
        const searchDTO: any = {
            city: this.searchDestination || undefined,
            checkIn: this.checkinDate || undefined,
            checkOut: this.checkoutDate || undefined,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            numberOfGuests: this.numberOfGuests
        };

        this.lastSearchDTO = searchDTO;

        console.log('DTO de búsqueda enviado al backend:', searchDTO);

        this.accommodationService.search(page, searchDTO).subscribe({
            next: (data: any) => {
                console.log('Respuesta de búsqueda:', data);
                this.properties = data?.content || [];

                // 👇 FILTRADO LOCAL POR SERVICIOS EN ESPAÑOL
                const activeServices = this.filters
                    .filter(f => f.type === 'service' && f.active && f.serviceName)
                    .map(f => f.serviceName);

                if (activeServices.length > 0) {
                    console.log('Filtrando por servicios:', activeServices);
                    this.filteredProperties = this.properties.filter(property => {
                        // Verificar que el alojamiento tenga TODOS los servicios seleccionados
                        return activeServices.every(service =>
                            property.services && property.services.includes(service)
                        );
                    });
                    console.log('Resultados filtrados:', this.filteredProperties.length);
                } else {
                    this.filteredProperties = this.properties;
                }

                this.totalPages = data?.totalPages || 1;
                this.currentPage = page + 1;

                if (this.filteredProperties.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: 'No se encontraron alojamientos con los filtros seleccionados',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            },
            error: (error: any) => {
                console.error('Error en búsqueda:', error);
                this.properties = [];
                this.filteredProperties = [];
                Swal.fire('Error', error.error.content || "Error al buscar alojamientos", 'error');
            }
        });
    }

    // --- MÉTODOS DE EVENTOS ---

    searchProperties(): void {
        if (this.isFavoritesActive) {
            this.filters.find(f => f.type === 'favorites')!.active = false;
            this.isFavoritesActive = false;
        }
        this.runSearch(0);
    }

    toggleFilter(filter: Filter): void {
        console.log('Toggle filter:', filter);

        if (filter.type === 'favorites') {
            this.isFavoritesActive = !this.isFavoritesActive;
            filter.active = this.isFavoritesActive;

            this.filters.forEach(f => {
                if (f.type !== 'favorites') {
                    f.active = false;
                }
            });

            this.searchDestination = '';

            if (this.isFavoritesActive) {
                this.loadFavorites(0);
            } else {
                this.loadInitialAccommodations(0);
            }

        } else {
            filter.active = !filter.active;

            this.isFavoritesActive = false;
            const favFilter = this.filters.find(f => f.type === 'favorites');
            if (favFilter) {
                favFilter.active = false;
            }

            this.runSearch(0);
        }
    }

    onDestinationChange(): void {
        this.isFavoritesActive = false;
        const favFilter = this.filters.find(f => f.type === 'favorites');
        if (favFilter) {
            favFilter.active = false;
        }

        if (this.searchDestination.trim()) {
            this.runSearch(0);
        }
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            const targetPage = page - 1;

            if (this.isFavoritesActive) {
                this.loadFavorites(targetPage);
            }
            else if (this.isSearchActive) {
                this.runSearch(targetPage);
            }
            else {
                this.loadInitialAccommodations(targetPage);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    clearAllFilters(): void {
        this.filters.forEach(filter => {
            filter.active = false;
        });
        this.searchDestination = '';
        this.minPrice = 50000;
        this.maxPrice = 500000;
        this.numberOfGuests = 1;
        this.initializeDates();

        this.isFavoritesActive = false;
        this.isSearchActive = false;

        this.loadInitialAccommodations(0);
    }

    get activeFiltersCount(): number {
        return this.filters.filter(f => f.active && f.type !== 'favorites').length;
    }

    // --- MÉTODOS AUXILIARES ---
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
            this.isFavoritesActive = false;
            const favFilter = this.filters.find(f => f.type === 'favorites');
            if (favFilter) { favFilter.active = false; }
            this.runSearch(0);
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

            this.isFavoritesActive = false;
            const favFilter = this.filters.find(f => f.type === 'favorites');
            if (favFilter) { favFilter.active = false; }
            this.runSearch(0);
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
        }
        else {
            this.maxPrice = Math.max(value, this.minPrice + 10000);
        }

        this.isFavoritesActive = false;
        const favFilter = this.filters.find(f => f.type === 'favorites');
        if (favFilter) { favFilter.active = false; }
        this.runSearch(0);
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
        }
        else if (this.activeHandle === 'max') {
            this.maxPrice = Math.min(this.maxRange, Math.max(value, this.minPrice + 10000));
        }
    }

    getPages(): number[] {
        const pages: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }
}