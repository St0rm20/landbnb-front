import { Component, OnInit, HostListener } from '@angular/core'; // 👈 Aseguramos HostListener
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Servicios y DTOs
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { ResponseDTO } from '../../models/response-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { AccommodationMetricsDTO } from '../../models/accommodation-metrics-dto.interface';
import { UserDto } from '../../models/user-dto.interface';

// Tipos para la paginación
interface PagedResponse {
    content: AccommodationDTO[];
    totalPages: number;
}

// Interfaz para el formato que usa tu HTML
interface DisplayMetric {
    icon: string;
    value: string;
    label: string;
}

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './statistics.component.html',
    // Asegúrate de que tienes un archivo statistics.component.css
    // styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

    // --- Propiedades del Navbar y Auth ---
    dropdownOpen = false; // 👈 NECESARIA PARA EL ESTADO
    userName: string = '';
    userEmail: string = '';
    isLoggedIn: boolean = false;
    userRole: string = '';

    // --- Datos de la Página ---
    accommodations: AccommodationDTO[] = [];
    selectedAccommodationId: number | null = null;
    metrics: AccommodationMetricsDTO | null = null;
    isLoadingMetrics: boolean = false;
    displayMetrics: DisplayMetric[] = [];

    // --- Control de Fechas ---
    startDate: string = '2025-01-01';
    endDate: string = new Date().toISOString().substring(0, 10);

    constructor(
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private router: Router,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        this.userRole = this.tokenService.getRole();

        if (!this.isLoggedIn || this.userRole !== 'HOST') {
            this.router.navigate(['/home']);
            Swal.fire('Acceso Denegado', 'Debes ser anfitrión para ver las métricas.', 'warning');
            return;
        }

        this.userEmail = this.tokenService.getEmail();
        this.loadUserProfile();

        this.loadHostAccommodations();
    }

    // 1. ✅ MÉTODO PARA CERRAR EL MENÚ AL HACER CLIC FUERA (Lo que previene que se abra instantáneamente)
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        // Si el clic no está dentro del dropdown, lo cerramos
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    // 2. ✅ MÉTODO PARA ABRIR/CERRAR EL MENÚ CON EL BOTÓN
    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation(); // 👈 IMPORTANTE: Evita que 'onDocumentClick' lo cierre inmediatamente
        this.dropdownOpen = !this.dropdownOpen;
    }


    // --- (El resto de tus métodos, adaptMetricsForDisplay, loadMetrics, etc., son correctos) ---

    /**
     * Carga el perfil del usuario para el saludo del Navbar
     */
    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
            },
            error: (error: any) => {
                console.error("Error cargando perfil", error);
                this.userName = this.userEmail;
            }
        });
    }

    /**
     * Carga la lista de alojamientos del anfitrión para el selector
     */
    loadHostAccommodations(): void {
        this.accommodations = [];

        this.accommodationService.getMyAccommodations(0).subscribe({
            next: (data: any) => {
                const accommodationsArray = data?.content || data;
                this.accommodations = Array.isArray(accommodationsArray) ? accommodationsArray : [];

                if (this.accommodations.length > 0) {
                    this.selectedAccommodationId = this.accommodations[0].id;
                    this.loadMetrics();
                } else {
                    this.metrics = null;
                    this.isLoadingMetrics = false;
                }
            },
            error: (err) => {
                this.accommodations = [];
                this.metrics = null;
                Swal.fire('Error', 'No se pudieron cargar tus alojamientos.', 'error');
            }
        });
    }

    /**
     * Carga las métricas para el alojamiento y rango de fecha seleccionado
     */
    loadMetrics(): void {
        if (!this.selectedAccommodationId || !this.startDate || !this.endDate) return;

        this.isLoadingMetrics = true;
        this.metrics = null;
        this.displayMetrics = [];

        const start = this.startDate;
        const end = this.endDate;

        this.accommodationService.getMetrics(this.selectedAccommodationId, start, end).subscribe({
            next: (data: ResponseDTO) => {
                this.metrics = data.content as AccommodationMetricsDTO;
                this.adaptMetricsForDisplay();
                this.isLoadingMetrics = false;
            },
            error: (err) => {
                this.metrics = null;
                this.isLoadingMetrics = false;
                Swal.fire('Error', err.error.message || 'No se pudieron obtener las métricas.', 'error');
            }
        });
    }

    /**
     * Mapea el DTO del backend al formato de tarjetas del HTML
     */
    adaptMetricsForDisplay(): void {
        if (!this.metrics) {
            this.displayMetrics = [];
            return;
        }

        const m = this.metrics;

        this.displayMetrics = [
            {
                icon: 'fas fa-money-bill-wave',
                value: this.formatNumber(m.totalRevenue) + ' COP',
                label: 'Ingresos Totales'
            },
            {
                icon: 'fas fa-calendar-check',
                value: this.formatNumber(m.confirmedBookings),
                label: 'Reservas Confirmadas'
            },
            {
                icon: 'fas fa-star',
                value: m.averageRating.toFixed(1),
                label: `Calificación (${this.formatNumber(m.totalReviews)} reseñas)`
            },
            {
                icon: 'fas fa-chart-line',
                value: m.occupancyRate.toFixed(1) + '%',
                label: 'Tasa de Ocupación'
            }
        ];
    }


    // --- MÉTODOS AUXILIARES Y MANEJO DE EVENTOS ---

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    // Formateo de números grandes (implementación robusta)
    formatNumber(value: number): string {
        if (value === undefined || value === null) return '0';
        return Math.round(value).toLocaleString('es-CO');
    }
}