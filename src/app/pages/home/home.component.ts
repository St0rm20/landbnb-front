import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { SearchAccommodationDTO } from '../../models/search-accommodation-dto.interface';
import Swal from 'sweetalert2';
import { ResponseDTO } from '../../models/response-dto.interface';

interface Filter {
    name: string;
    icon: string;
    active: boolean;
    type: string;
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
    lastSearchDTO: SearchAccommodationDTO = {};
    filters: Filter[] = [
        { name: 'Populares', icon: 'fas fa-star', active: true, type: 'popular' },
        { name: 'WiFi', icon: 'fas fa-wifi', active: false, type: 'wifi' },
        { name: 'Piscina', icon: 'fas fa-swimming-pool', active: false, type: 'pool' },
        { name: 'Mascotas', icon: 'fas fa-dog', active: false, type: 'pets' },
        { name: 'Aire Acon.', icon: 'fas fa-snowflake', active: false, type: 'ac' },
        { name: 'Cocina', icon: 'fas fa-utensils', active: false, type: 'kitchen' },
        { name: 'Parking', icon: 'fas fa-parking', active: false, type: 'parking' }
    ];
    properties: AccommodationDTO[] = [];
    filteredProperties: AccommodationDTO[] = [];

    // --- PROPIEDADES DE AUTENTICACIÓN ---
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

        // --- LÓGICA DE AUTENTICACIÓN ---
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
            next: (data: UserDto) => {
                this.userName = data.name;
            },
            error: (error: any) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = ''; // Dejamos que el HTML use el email
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
        this.accommodationService.getAll(page).subscribe({
            next: (data: ResponseDTO) => {
                const responseData = data.content as PagedResponse;
                this.properties = responseData.content;
                this.filteredProperties = this.properties;
                this.totalPages = responseData.totalPages;
                this.currentPage = page + 1;
            },
            error: (error: any) => {
                Swal.fire('Error', error.error.content || "Error al obtener los alojamientos", 'error');
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

        this.lastSearchDTO = searchDTO;

        this.accommodationService.search(page, searchDTO).subscribe({
            next: (data: ResponseDTO) => {
                const responseData = data.content as PagedResponse;
                this.properties = responseData.content;
                this.filteredProperties = this.properties;
                this.totalPages = responseData.totalPages;
                this.currentPage = page + 1;
            },
            error: (error: any) => {
                Swal.fire('Error', error.error.content || "Error al buscar alojamientos", 'error');
            }
        });
    }

    // --- MÉTODOS DE EVENTOS ---
    searchProperties(): void { this.runSearch(0); }
    toggleFilter(filter: Filter): void { filter.active = !filter.active; this.runSearch(0); }
    onDestinationChange(): void { }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            const targetPage = page - 1;
            if (this.isSearchActive) { this.runSearch(targetPage); }
            else { this.loadInitialAccommodations(targetPage); }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
        if (!this.dateError) { this.runSearch(0); }
    }
    validateDates(): void {
        this.dateError = '';
        if (this.checkinDate && this.checkoutDate) {
            const checkin = new Date(this.checkinDate);
            const checkout = new Date(this.checkoutDate);
            if (checkout < checkin) { this.dateError = 'La fecha de salida no puede ser anterior a la fecha de entrada'; return; }
            if (checkin.getTime() === checkout.getTime()) { this.dateError = 'La estadía debe ser de al menos una noche'; return; }
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
                if (checkout <= checkin) { this.checkoutDate = this.minCheckoutDate; }
            }
        }
    }
    clearDateError(): void { this.dateError = ''; }
    getRangeLeft(): string { return ((this.minPrice - this.minRange) / (this.maxRange - this.minRange) * 100) + '%'; }
    getRangeWidth(): string { return ((this.maxPrice - this.minPrice) / (this.maxRange - this.minRange) * 100) + '%'; }
    getHandlePosition(handle: 'min' | 'max'): string { const value = handle === 'min' ? this.minPrice : this.maxPrice; return ((value - this.minRange) / (this.maxRange - this.minRange) * 100) + '%'; }
    startDrag(event: MouseEvent, handle: 'min' | 'max'): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
        this.activeHandle = handle;
        const moveHandler = (moveEvent: MouseEvent) => { if (this.isDragging && this.activeHandle) { this.updateSliderValue(moveEvent); } };
        const upHandler = () => {
            this.isDragging = false;
            this.activeHandle = null;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
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
        if (minDistance < maxDistance) { this.minPrice = Math.min(value, this.maxPrice - 10000); }
        else { this.maxPrice = Math.max(value, this.minPrice + 10000); }
        this.runSearch(0);
    }
    updateSliderValue(event: MouseEvent): void {
        const track = document.querySelector('.slider-track') as HTMLElement;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const percentage = x / rect.width;
        const value = Math.round(percentage * (this.maxRange - this.minRange) + this.minRange);
        if (this.activeHandle === 'min') { this.minPrice = Math.max(this.minRange, Math.min(value, this.maxPrice - 10000)); }
        else if (this.activeHandle === 'max') { this.maxPrice = Math.min(this.maxRange, Math.max(value, this.minPrice + 10000)); }
    }
    getPages(): number[] {
        const pages: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) { pages.push(i); }
        return pages;
    }
}