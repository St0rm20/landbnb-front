import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
    serviceName: string;
}

interface PagedResponse {
    content: AccommodationDTO[];
    totalPages: number;
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
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    constructor(
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private userService: UserService,
        private router: Router,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.initializeDates();
        this.loadInitialAccommodations(0);
        this.checkAuthentication();
    }

    ngAfterViewInit(): void { }

    checkAuthentication(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.userName = '';
            this.userEmail = '';
            this.userRole = '';
            this.profilePicUrl = 'assets/imagenes/perfil.png';
        }
    }

    get isHost(): boolean {
        return this.userRole === 'HOST';
    }

    get isUser(): boolean {
        return this.userRole === 'USER';
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = data.name;
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error: any) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = '';
                this.profilePicUrl = 'assets/imagenes/perfil.png';
            }
        });
    }

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    private processAccommodationData(accommodation: any): AccommodationDTO {
        console.log('--- PROCESANDO ACCOMMODATION ---');
        console.log('ID:', accommodation.id);
        console.log('mainImage ANTES:', accommodation.mainImage);
        console.log('images ANTES:', accommodation.images);

        let mainImageUrl = accommodation.mainImage;
        let allImages: string[] = accommodation.images || [];

        // Procesar imagen principal
        if (mainImageUrl) {
            console.log('Procesando mainImage...');
            mainImageUrl = this.fixCloudinaryUrl(mainImageUrl);
            console.log('mainImage DESPUÉS de fixCloudinaryUrl:', mainImageUrl);
        } else {
            console.log('No hay mainImage, buscando en images array...');
            // Si no hay imagen principal, usar la primera de la lista o un placeholder
            mainImageUrl = allImages.length > 0
                ? this.fixCloudinaryUrl(allImages[0])
                : 'assets/imagenes/default-property.jpg';
            console.log('mainImage asignada desde array o placeholder:', mainImageUrl);
        }

        // Procesar todas las imágenes y filtrar URLs vacías
        allImages = allImages
            .map(img => {
                const fixed = this.fixCloudinaryUrl(img);
                console.log(`Imagen array: ${img} -> ${fixed}`);
                return fixed;
            })
            .filter(img => {
                const isValid = img && img.trim() !== '';
                console.log(`Validando imagen: ${img} -> ${isValid ? 'válida' : 'inválida'}`);
                return isValid;
            });

        console.log('mainImage FINAL:', mainImageUrl);
        console.log('images FINAL:', allImages);
        console.log('--- FIN PROCESAMIENTO ---\n');

        return {
            id: accommodation.id,
            title: accommodation.title || 'Sin título',
            description: accommodation.description || 'Sin descripción',
            city: accommodation.city || 'Ciudad no especificada',
            address: accommodation.address || 'Dirección no especificada',
            latitude: accommodation.latitude || 0,
            longitude: accommodation.longitude || 0,
            pricePerNight: accommodation.pricePerNight || 0,
            maxCapacity: accommodation.maxCapacity || 1,
            services: accommodation.services || [],
            mainImage: mainImageUrl,
            images: allImages,
            averageRating: accommodation.averageRating || 0,
            totalBookings: accommodation.totalBookings || 0
        };
    }

    loadInitialAccommodations(page: number): void {
        this.isSearchActive = false;
        this.isFavoritesActive = false;
        this.accommodationService.getAll(page).subscribe({
            next: (data: any) => {
                this.properties = (data.content || []).map((accommodation: any) =>
                    this.processAccommodationData(accommodation)
                );

                this.filteredProperties = [...this.properties];
                this.totalPages = data?.totalPages || 1;
                this.currentPage = page + 1;
            },
            error: (error: any) => {
                console.error('Error al obtener alojamientos:', error);
                this.properties = [];
                this.filteredProperties = [];
                Swal.fire('Error', error.error?.content || "Error al obtener los alojamientos", 'error');
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

    handleImageError(event: Event): void {
        const imgElement = event.target as HTMLImageElement;

        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%23999"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
        imgElement.onerror = null;

    }

    loadFavorites(page: number): void {
        this.isSearchActive = true;
        this.isFavoritesActive = true;

        this.accommodationService.getFavoriteAccommodations(page).subscribe({
            next: (data: any) => {
                console.log('=== DATOS DE FAVORITOS RAW ===');
                console.log('Data completa:', data);
                console.log('Content:', data.content);

                if (data.content && data.content.length > 0) {
                    console.log('Primer alojamiento RAW:', data.content[0]);
                    console.log('mainImage del primer alojamiento:', data.content[0].mainImage);
                    console.log('images del primer alojamiento:', data.content[0].images);
                }

                // CORRECCIÓN: Usar processAccommodationData para procesar las URLs de las imágenes
                this.properties = (data.content || []).map((accommodation: any) => {
                    const processed = this.processAccommodationData(accommodation);
                    console.log('=== ALOJAMIENTO PROCESADO ===');
                    console.log('ID:', processed.id);
                    console.log('Title:', processed.title);
                    console.log('mainImage DESPUÉS de procesar:', processed.mainImage);
                    console.log('images DESPUÉS de procesar:', processed.images);
                    return processed;
                });

                this.filteredProperties = [...this.properties];
                this.totalPages = data?.totalPages || 1;
                this.currentPage = page + 1;

                console.log('=== PROPIEDADES FINALES ===');
                console.log('Total properties:', this.properties.length);
                console.log('Filtered properties:', this.filteredProperties.length);

                if (this.properties.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin favoritos',
                        text: 'No tienes alojamientos marcados como favoritos',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            },
            error: (err) => {
                console.error('Error cargando favoritos:', err);
                this.properties = [];
                this.filteredProperties = [];
                Swal.fire('Error', 'No se pudieron cargar tus favoritos', 'error');
            }
        });
    }

    runSearch(page: number): void {
        this.validateDates();
        if (this.dateError) {
            this.filteredProperties = [];
            return;
        }

        this.isSearchActive = true;
        this.isFavoritesActive = false;

        const searchDTO: any = {
            city: this.searchDestination || undefined,
            checkIn: this.checkinDate || undefined,
            checkOut: this.checkoutDate || undefined,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            numberOfGuests: this.numberOfGuests
        };

        this.lastSearchDTO = searchDTO;

        this.accommodationService.search(page, searchDTO).subscribe({
            next: (data: any) => {
                this.properties = (data?.content || []).map((accommodation: any) =>
                    this.processAccommodationData(accommodation)
                );

                this.applyServiceFilters();

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
                Swal.fire('Error', error.error?.content || "Error al buscar alojamientos", 'error');
            }
        });
    }

    applyServiceFilters(): void {
        const activeServices = this.filters
            .filter(f => f.type === 'service' && f.active && f.serviceName)
            .map(f => f.serviceName);

        if (activeServices.length > 0) {
            this.filteredProperties = this.properties.filter(property => {
                const hasAllServices = activeServices.every(service =>
                    property.services &&
                    Array.isArray(property.services) &&
                    property.services.some(propService =>
                        this.normalizeServiceName(propService) === this.normalizeServiceName(service)
                    )
                );
                return hasAllServices;
            });
        } else {
            this.filteredProperties = [...this.properties];
        }
    }

    private normalizeServiceName(service: string): string {
        return service.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    searchProperties(): void {
        if (this.isFavoritesActive) {
            this.filters.find(f => f.type === 'favorites')!.active = false;
            this.isFavoritesActive = false;
        }
        this.runSearch(0);
    }

    toggleFilter(filter: Filter): void {
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

            if (this.isSearchActive || this.properties.length > 0) {
                this.applyServiceFilters();
            } else {
                this.runSearch(0);
            }
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
        } else {
            this.loadInitialAccommodations(0);
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
        const maxPagesToShow = 5;
        const startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    }
}