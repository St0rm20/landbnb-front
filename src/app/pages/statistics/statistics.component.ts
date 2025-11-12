import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Servicios y DTO
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { AccommodationMetricsDTO } from '../../models/accommodation-metrics-dto.interface';
import { UserDto } from '../../models/user-dto.interface';

// Interfaz para el formato que usa tu HTML
interface DisplayMetric {
    icon: string;
    value: string;
    label: string;
    type?: string; // Para aplicar clases CSS específicas
}

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

    // --- Propiedades del Navbar y Auth ---
    dropdownOpen = false;
    userName: string = '';
    userEmail: string = '';
    isLoggedIn: boolean = false;
    userRole: string = '';

    // --- Datos de la Página ---
    accommodations: AccommodationDTO[] = [];
    selectedAccommodationId: number | null = null;
    metrics: AccommodationMetricsDTO | null = null;
    isLoadingMetrics: boolean = false;
    isLoadingAccommodations: boolean = false;
    displayMetrics: DisplayMetric[] = [];

    // --- Control de Fechas ---
    startDate: string = '';
    endDate: string = '';

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

        // Configurar fechas por defecto (últimos 30 días)
        this.setDefaultDateRange();
        this.userEmail = this.tokenService.getEmail();
        this.loadUserProfile();
        this.loadHostAccommodations();
    }

    // ===== CONFIGURACIÓN DE FECHAS =====
    setDefaultDateRange(): void {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // Últimos 30 días

        this.endDate = end.toISOString().split('T')[0];
        this.startDate = start.toISOString().split('T')[0];
    }

    // ===== GESTIÓN DEL DROPDOWN =====
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

    // ===== CARGA DE DATOS =====
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

    loadHostAccommodations(): void {
        this.isLoadingAccommodations = true;
        this.accommodations = [];

        this.accommodationService.getMyAccommodations(0).subscribe({
            next: (data: any) => {
                console.log('Alojamientos recibidos:', data);

                const accommodationsArray = data?.content || data || [];
                this.accommodations = Array.isArray(accommodationsArray) ? accommodationsArray : [];

                if (this.accommodations.length > 0) {
                    this.selectedAccommodationId = this.accommodations[0].id;
                    this.loadMetrics();
                } else {
                    this.metrics = null;
                    this.isLoadingMetrics = false;
                }
                this.isLoadingAccommodations = false;
            },
            error: (err) => {
                console.error('Error cargando alojamientos:', err);
                this.accommodations = [];
                this.metrics = null;
                this.isLoadingAccommodations = false;
                this.isLoadingMetrics = false;
                Swal.fire('Error', 'No se pudieron cargar tus alojamientos.', 'error');
            }
        });
    }

    loadMetrics(): void {
        if (!this.selectedAccommodationId || !this.startDate || !this.endDate) {
            console.warn('Faltan datos para cargar métricas:', {
                accommodationId: this.selectedAccommodationId,
                startDate: this.startDate,
                endDate: this.endDate
            });
            return;
        }

        this.isLoadingMetrics = true;
        this.metrics = null;
        this.displayMetrics = [];

        console.log('Cargando métricas para:', {
            accommodationId: this.selectedAccommodationId,
            startDate: this.startDate,
            endDate: this.endDate
        });

        this.accommodationService.getMetrics(this.selectedAccommodationId, this.startDate, this.endDate).subscribe({
            next: (response: any) => {
                console.log('Respuesta completa de métricas:', response);

                // Manejar diferentes estructuras de respuesta
                let metricsData = null;

                if (response && response.content) {
                    metricsData = response.content;
                } else if (response && typeof response === 'object') {
                    metricsData = response;
                } else if (response && response.data) {
                    metricsData = response.data;
                }

                if (metricsData) {
                    this.metrics = this.normalizeMetricsData(metricsData);
                    console.log('Métricas normalizadas:', this.metrics);
                    this.adaptMetricsForDisplay();
                } else {
                    console.warn('No se pudieron extraer métricas de la respuesta:', response);
                    this.metrics = null;
                }

                this.isLoadingMetrics = false;
            },
            error: (err) => {
                console.error('Error cargando métricas:', err);
                this.metrics = null;
                this.isLoadingMetrics = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudieron cargar las métricas. Verifica que el servicio esté disponible.',
                    confirmButtonText: 'Entendido'
                });
            }
        });
    }

    // ===== NORMALIZACIÓN DE DATOS =====
    normalizeMetricsData(data: any): AccommodationMetricsDTO {
        console.log('Normalizando datos:', data);

        // Calcular totalBookings si no viene en la respuesta
        const confirmedBookings = data.confirmedBookings || data.confirmed_bookings || data.confirmed || 0;
        const cancelledBookings = data.cancelledBookings || data.cancelled_bookings || data.cancelled || 0;
        const pendingBookings = data.pendingBookings || data.pending_bookings || data.pending || 0;

        // Si totalBookings no viene, calcularlo
        const totalBookings = data.totalBookings || data.total_bookings || data.total ||
            (confirmedBookings + cancelledBookings + pendingBookings);

        // Calcular huéspedes reales basado en reservas confirmadas
        const totalGuests = data.totalGuests || data.total_guests || data.guests || data.huespedes ||
            (confirmedBookings * 2); // Estimación: 2 huéspedes por reserva confirmada

        return {
            accommodationId: data.accommodationId || data.accommodation_id || this.selectedAccommodationId || 0,
            accommodationName: data.accommodationName || data.accommodation_name || data.name || 'Alojamiento',
            totalRevenue: data.totalRevenue || data.total_revenue || data.revenue || data.ingresos || 0,
            totalBookings: totalBookings,
            confirmedBookings: confirmedBookings,
            cancelledBookings: cancelledBookings,
            pendingBookings: pendingBookings,
            averageRating: data.averageRating || data.average_rating || data.rating || data.calificacion || 0,
            totalReviews: data.totalReviews || data.total_reviews || data.reviews || data.resenas || 0,
            occupancyRate: data.occupancyRate || data.occupancy_rate || data.ocupacion || 0,
            totalGuests: totalGuests,
            averageBookingValue: data.averageBookingValue || data.average_booking_value || data.avg_booking || 0
        };
    }

    // ===== TRANSFORMACIÓN DE DATOS - SOLO MÉTRICAS ESENCIALES =====
    adaptMetricsForDisplay(): void {
        if (!this.metrics) {
            this.displayMetrics = [];
            return;
        }

        const m = this.metrics;

        console.log('Adaptando métricas para mostrar:', m);

        // Calcular métricas derivadas
        const successRate = m.totalBookings > 0 ? (m.confirmedBookings / m.totalBookings) * 100 : 0;
        const cancellationRate = m.totalBookings > 0 ? (m.cancelledBookings / m.totalBookings) * 100 : 0;

        // SOLO 8 MÉTRICAS ESENCIALES
        this.displayMetrics = [
            {
                icon: 'fas fa-calendar-check',
                value: this.formatNumber(m.confirmedBookings),
                label: 'Reservas Confirmadas',
                type: 'success'
            },
            {
                icon: 'fas fa-money-bill-wave',
                value: m.totalRevenue > 0 ? '$' + this.formatNumber(m.totalRevenue) + ' COP' : '$0 COP',
                label: 'Ingresos Totales',
                type: 'income'
            },
            {
                icon: 'fas fa-users',
                value: this.formatNumber(m.totalGuests),
                label: 'Total Huéspedes',
                type: 'info'
            },
            {
                icon: 'fas fa-star',
                value: m.averageRating > 0 ? m.averageRating.toFixed(1) + '/5' : 'N/A',
                label: 'Calificación Promedio',
                type: 'rating'
            },
            {
                icon: 'fas fa-trophy',
                value: successRate > 0 ? successRate.toFixed(1) + '%' : '0%',
                label: 'Tasa de Confirmación',
                type: 'success'
            },
            {
                icon: 'fas fa-bed',
                value: m.occupancyRate.toFixed(1) + '%',
                label: 'Tasa de Ocupación',
                type: 'info'
            },
            {
                icon: 'fas fa-comment',
                value: this.formatNumber(m.totalReviews),
                label: 'Total Reseñas',
                type: 'info'
            },
            {
                icon: 'fas fa-ban',
                value: cancellationRate > 0 ? cancellationRate.toFixed(1) + '%' : '0%',
                label: 'Tasa de Cancelación',
                type: 'warning'
            }
        ];
    }

    // ===== EVENTOS =====
    onAccommodationChange(): void {
        console.log('Alojamiento cambiado:', this.selectedAccommodationId);
        this.loadMetrics();
    }

    onDateRangeChange(): void {
        console.log('Rango de fechas cambiado:', this.startDate, 'a', this.endDate);
        this.loadMetrics();
    }

    refreshMetrics(): void {
        this.loadMetrics();
    }

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    // ===== UTILIDADES =====
    formatNumber(value: number): string {
        if (value === undefined || value === null) return '0';
        return Math.round(value).toLocaleString('es-CO');
    }
}