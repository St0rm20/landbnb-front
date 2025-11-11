import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// 1. Importar Servicios y DTOs
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import {UserDto } from '../../models/user-dto.interface'
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { ResponseDTO } from '../../models/response-dto.interface';

// Interfaz para la respuesta paginada
interface PagedResponse {
    content: AccommodationDTO[];
    totalPages: number;
}

@Component({
    selector: 'app-host-properties',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './host-properties.component.html',
    styleUrls: ['./host-properties.component.css']
})
export class HostPropertiesComponent implements OnInit {

    // --- Lógica del Navbar ---
    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    // --- Lógica de la Página ---
    properties: AccommodationDTO[] = []; // 👈 Inicializado (¡Esto está bien!)
    isLoading: boolean = true;
    page: number = 0;
    totalPages: number = 1;

    constructor(
        private router: Router,
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        }

        this.loadMyAccommodations(this.page);
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => { this.userName = data.name; },
            error: (error: any) => { console.error("Error cargando perfil", error); }
        });
    }

    loadMyAccommodations(page: number): void {
        this.isLoading = true;
        this.accommodationService.getMyAccommodations(page).subscribe({
            next: (data: ResponseDTO) => {
                const response = data.content as PagedResponse;

                //
                // --- 👇 CORRECCIÓN (Error TS2339) ---
                //
                // Si 'response' o 'response.content' son nulos,
                // asigna un array vacío [] para evitar el error.
                this.properties = response?.content || [];
                this.totalPages = response?.totalPages || 1;
                this.isLoading = false;
                // --- FIN DE LA CORRECCIÓN ---
            },
            error: (err) => {
                this.isLoading = false;
                // Si la API falla, también nos aseguramos de que 'properties' sea un array
                this.properties = [];
                Swal.fire('Error', err.error.message || 'No se pudieron cargar tus alojamientos', 'error');
            }
        });
    }

    editProperty(property: AccommodationDTO): void {
        this.router.navigate(['/edit-accommodation', property.id]);
    }

    deleteProperty(property: AccommodationDTO): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar "${property.title}"? ¡No podrás revertir esto!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a675f',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡bórralo!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.accommodationService.delete(property.id).subscribe({
                    next: () => {
                        Swal.fire('¡Borrado!', 'Tu alojamiento ha sido eliminado.', 'success');
                        this.loadMyAccommodations(this.page);
                    },
                    error: (err) => {
                        Swal.fire('Error', err.error.message || 'No se pudo borrar el alojamiento', 'error');
                    }
                });
            }
        });
    }

    // --- Lógica del Navbar ---
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

    // --- Funciones auxiliares (Adaptadas al DTO) ---


    // (Usamos 'totalBookings' de tu DTO)
    getTotalViews(): number {
        return this.properties.reduce((sum, p) => sum + (p.totalBookings || 0), 0);
    }

    // (Usamos 'averageRating' de tu DTO)
    getAverageRating(): string {
        const ratedProps = this.properties.filter(p => p.averageRating);
        if (ratedProps.length === 0) return '0.0';
        const sum = ratedProps.reduce((acc, p) => acc + (p.averageRating || 0), 0);
        return (sum / ratedProps.length).toFixed(1);
    }
}