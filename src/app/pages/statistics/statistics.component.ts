import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
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
    type?: string;
}

@Component({
    selector: 'app-statistics',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

    dropdownOpen = false;
    userName: string = '';
    userEmail: string = '';
    isLoggedIn: boolean = false;
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    accommodations: AccommodationDTO[] = [];
    selectedAccommodationId: number | null = null;
    metrics: AccommodationMetricsDTO | null = null;
    isLoadingMetrics: boolean = false;
    isLoadingAccommodations: boolean = false;
    displayMetrics: DisplayMetric[] = [];

    startDate: string = '';
    endDate: string = '';

    constructor(
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private router: Router,
        private userService: UserService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        this.userRole = this.tokenService.getRole();

        if (!this.isLoggedIn || this.userRole !== 'HOST') {
            this.router.navigate(['/home']);
            Swal.fire('Acceso Denegado', 'Debes ser anfitrión para ver las métricas.', 'warning');
            return;
        }

        this.setDefaultDateRange();
        this.userEmail = this.tokenService.getEmail();
        this.loadUserProfile();
        this.loadHostAccommodations();
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error: any) => {
                console.error("Error cargando perfil", error);
                this.userName = this.userEmail;
                this.profilePicUrl = 'assets/imagenes/perfil.png';
            }
        });
    }

    private fixCloudinaryUrl(url: string | null | undefined): string {
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            return '';
        }
        if (url.startsWith('https://')) return url;
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
        imgElement.src = 'assets/imagenes/perfil.png';
        imgElement.onerror = null;
    }

    setDefaultDateRange(): void {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        this.endDate = end.toISOString().split('T')[0];
        this.startDate = start.toISOString().split('T')[0];
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
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    loadHostAccommodations(): void {
        this.isLoadingAccommodations = true;
        this.accommodations = [];

        this.accommodationService.getMyAccommodations(0).subscribe({
            next: (data: any) => {
                console.log('📦 Alojamientos recibidos:', data);
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
                console.error('❌ Error cargando alojamientos:', err);
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
            console.warn('⚠️ Faltan datos para cargar métricas');
            return;
        }

        this.isLoadingMetrics = true;
        this.metrics = null;
        this.displayMetrics = [];

        console.log('🔄 Cargando métricas...', {
            accommodationId: this.selectedAccommodationId,
            startDate: this.startDate,
            endDate: this.endDate
        });

        this.accommodationService.getMetrics(
            this.selectedAccommodationId,
            this.startDate,
            this.endDate
        ).subscribe({
            next: (response: any) => {
                console.log('✅ RESPUESTA COMPLETA DEL BACKEND:', response);
                console.log('📊 Tipo de response:', typeof response);
                console.log('📊 Keys de response:', Object.keys(response));

                // ✅ CORRECCIÓN: El backend puede devolver directamente el objeto o wrapped en "content"
                let metricsData = null;

                if (response) {
                    // Si viene directamente el objeto con las propiedades
                    if (response.totalBookings !== undefined || response.confirmedBookings !== undefined) {
                        metricsData = response;
                        console.log('📈 Métricas encontradas directamente en response');
                    }
                    // Si viene wrapped en content
                    else if (response.content) {
                        metricsData = response.content;
                        console.log('📈 Métricas encontradas en response.content');
                    }
                }

                if (metricsData) {
                    console.log('📊 DATOS DE MÉTRICAS RAW:', metricsData);
                    console.log('🔍 TODAS LAS PROPIEDADES DEL BACKEND:', Object.keys(metricsData));
                    console.log('🔍 VALORES COMPLETOS:', JSON.stringify(metricsData, null, 2));
                    this.metrics = this.normalizeMetricsData(metricsData);
                    console.log('✨ MÉTRICAS NORMALIZADAS:', this.metrics);
                    this.adaptMetricsForDisplay();
                } else {
                    console.warn('⚠️ No se encontraron métricas en la respuesta');
                    this.metrics = null;
                    this.displayMetrics = [];
                }

                this.isLoadingMetrics = false;
            },
            error: (err) => {
                console.error('❌ Error cargando métricas:', err);
                console.error('❌ Detalles del error:', err.error);
                this.metrics = null;
                this.displayMetrics = [];
                this.isLoadingMetrics = false;

                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar métricas',
                    text: err.error?.message || 'No se pudieron cargar las métricas.',
                    showConfirmButton: true
                });
            }
        });
    }

    // ✅ NORMALIZACIÓN MEJORADA - Maneja múltiples formatos del backend
    normalizeMetricsData(data: any): AccommodationMetricsDTO {
        console.log('🔧 Normalizando datos:', data);

        // Extraer valores con múltiples posibles nombres (camelCase, snake_case, español)
        const extractValue = (obj: any, ...keys: string[]): number => {
            for (const key of keys) {
                if (obj[key] !== undefined && obj[key] !== null) {
                    const value = Number(obj[key]);
                    console.log(`   ✓ ${key}: ${value}`);
                    return isNaN(value) ? 0 : value;
                }
            }
            console.log(`   ✗ No encontrado en: ${keys.join(', ')}`);
            return 0;
        };

        const confirmedBookings = extractValue(data, 'confirmedBookings', 'confirmed_bookings', 'confirmed', 'reservasConfirmadas');
        const cancelledBookings = extractValue(data, 'cancelledBookings', 'cancelled_bookings', 'cancelled', 'canceladas', 'reservasCanceladas');
        const pendingBookings = extractValue(data, 'pendingBookings', 'pending_bookings', 'pending', 'pendientes', 'reservasPendientes');
        const completedBookings = extractValue(data, 'completedBookings', 'completed_bookings', 'completed', 'completadas', 'reservasCompletadas');

        // Total bookings: si no viene, calcular sumando todos los estados
        let totalBookings = extractValue(data, 'totalBookings', 'total_bookings', 'total', 'totalReservas');
        if (totalBookings === 0) {
            totalBookings = confirmedBookings + cancelledBookings + pendingBookings + completedBookings;
            console.log('   📊 Total calculado:', totalBookings);
        }

        // Ingresos totales
        const totalRevenue = extractValue(data, 'totalRevenue', 'total_revenue', 'revenue', 'ingresos', 'ingresosTotal', 'totalIngresos');

        // Total de huéspedes
        const totalGuests = extractValue(data, 'totalGuests', 'total_guests', 'guests', 'huespedes', 'totalHuespedes');

        // Calcular valor promedio por reserva
        const totalConfirmedCompleted = confirmedBookings + completedBookings;
        const averageBookingValue = totalConfirmedCompleted > 0 ?
            Math.round(totalRevenue / totalConfirmedCompleted) : 0;

        // Rating y reviews
        const averageRating = extractValue(data, 'averageRating', 'average_rating', 'rating', 'calificacion', 'calificacionPromedio');
        const totalReviews = extractValue(data, 'totalReviews', 'total_reviews', 'reviews', 'resenas', 'totalResenas');

        // Tasa de ocupación
        const occupancyRate = extractValue(data, 'occupancyRate', 'occupancy_rate', 'ocupacion', 'tasaOcupacion');

        const normalized: AccommodationMetricsDTO = {
            accommodationId: data.accommodationId || data.accommodation_id || this.selectedAccommodationId || 0,
            accommodationName: data.accommodationName || data.accommodation_name || data.name || 'Alojamiento',
            totalRevenue: totalRevenue,
            totalBookings: totalBookings,
            confirmedBookings: confirmedBookings,
            cancelledBookings: cancelledBookings,
            pendingBookings: pendingBookings,
            completedBookings: completedBookings,
            averageRating: averageRating,
            totalReviews: totalReviews,
            occupancyRate: occupancyRate,
            totalGuests: totalGuests,
            averageBookingValue: averageBookingValue
        };

        console.log('✅ MÉTRICAS NORMALIZADAS:', normalized);
        return normalized;
    }

    // ✅ ADAPTACIÓN MEJORADA PARA MOSTRAR
    adaptMetricsForDisplay(): void {
        if (!this.metrics) {
            this.displayMetrics = [];
            return;
        }

        const m = this.metrics;
        console.log('🎨 Adaptando métricas para display:', m);

        // Calcular métricas derivadas
        const totalConfirmedCompleted = (m.confirmedBookings || 0) + (m.completedBookings || 0);
        const successRate = m.totalBookings > 0 ? (totalConfirmedCompleted / m.totalBookings) * 100 : 0;
        const cancellationRate = m.totalBookings > 0 ? ((m.cancelledBookings || 0) / m.totalBookings) * 100 : 0;

        this.displayMetrics = [
            {
                icon: 'fas fa-calendar-check',
                value: this.formatNumber(totalConfirmedCompleted),
                label: 'Reservas Completadas',
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
                value: this.formatNumber(m.totalGuests || 0),
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
                label: 'Tasa de Éxito',
                type: 'success'
            },
            {
                icon: 'fas fa-bed',
                value: (m.occupancyRate || 0).toFixed(1) + '%',
                label: 'Tasa de Ocupación',
                type: 'info'
            },
            {
                icon: 'fas fa-comment',
                value: this.formatNumber(m.totalReviews || 0),
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

        console.log('✅ Display metrics preparadas:', this.displayMetrics);
    }

    onAccommodationChange(): void {
        console.log('🔄 Alojamiento cambiado:', this.selectedAccommodationId);
        this.loadMetrics();
    }

    onDateRangeChange(): void {
        console.log('🔄 Rango de fechas cambiado:', this.startDate, 'a', this.endDate);
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

    formatNumber(value: number): string {
        if (value === undefined || value === null) return '0';
        return Math.round(value).toLocaleString('es-CO');
    }
}