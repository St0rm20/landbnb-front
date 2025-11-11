import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Importar Servicios y DTOs
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { ResponseDTO } from '../../models/response-dto.interface';


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
    properties: AccommodationDTO[] = [];
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
        // Cargar datos del Navbar
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        }

        // Cargar alojamientos del anfitrión
        this.loadMyAccommodations(this.page);
    }

    /**
     * Carga el perfil del usuario para obtener el nombre
     */
    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = data.name;
            },
            error: (error: any) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = ''; // Si falla, el HTML usará el email
            }
        });
    }

    /**
     * Carga los alojamientos del anfitrión (Punto 10 del .http)
     */
    loadMyAccommodations(page: number): void {
        this.isLoading = true;
        this.accommodationService.getMyAccommodations(page).subscribe({
            next: (data: ResponseDTO) => {
                const response = data.content as PagedResponse;
                this.properties = response.content;
                this.totalPages = response.totalPages;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                Swal.fire('Error', err.error.message || 'No se pudieron cargar tus alojamientos', 'error');
            }
        });
    }

    /**
     * Navega a la página de edición
     */
    editProperty(property: AccommodationDTO): void {
        this.router.navigate(['/edit-accommodation', property.id]);
    }

    /**
     * Borra un alojamiento (Punto 5 del .http)
     */
    deleteProperty(property: AccommodationDTO): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar "${property.title}"?`,
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

    // --- Funciones auxiliares---

    getTotalViews(): number {
        return this.properties.reduce((sum, p) => sum + (p.totalBookings || 0), 0);
    }


    getAverageRating(): string {
        const activeProps = this.properties.filter(p => p.averageRating);
        if (activeProps.length === 0) return '0.0';
        const sum = activeProps.reduce((acc, p) => acc + (p.averageRating || 0), 0);
        return (sum / activeProps.length).toFixed(1);
    }
}