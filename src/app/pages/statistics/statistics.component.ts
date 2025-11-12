import { Component, OnInit, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

// Servicios y DTO
import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { ResponseDTO } from '../../models/response-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';
import { AccommodationMetricsDTO } from '../../models/accommodation-metrics-dto.interface';
import { UserDto } from '../../models/user-dto.interface';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

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
    styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, AfterViewInit, OnDestroy {

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
    displayMetrics: DisplayMetric[] = [];

    // --- Control de Fechas ---
    startDate: string = '2024-06-01';
    endDate: string = new Date().toISOString().substring(0, 10);

    // --- Chart.js ---
    private chart: Chart | null = null;

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

    ngAfterViewInit(): void {
        // El gráfico se creará después de cargar las métricas
    }

    ngOnDestroy(): void {
        // Destruir el gráfico cuando se destruya el componente
        if (this.chart) {
            this.chart.destroy();
        }
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
                console.error('Error cargando alojamientos:', err);
                this.accommodations = [];
                this.metrics = null;
                Swal.fire('Error', 'No se pudieron cargar tus alojamientos.', 'error');
            }
        });
    }

    loadMetrics(): void {
        if (!this.selectedAccommodationId || !this.startDate || !this.endDate) return;

        this.isLoadingMetrics = true;
        this.metrics = null;
        this.displayMetrics = [];

        // Destruir gráfico anterior si existe
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const start = this.startDate;
        const end = this.endDate;

        this.accommodationService.getMetrics(this.selectedAccommodationId, start, end).subscribe({
            next: (data: any) => {
                // El backend puede devolver directamente las métricas o en un wrapper
                this.metrics = data.content ? data.content as AccommodationMetricsDTO : data as AccommodationMetricsDTO;

                console.log('Métricas recibidas:', this.metrics); // Para debug

                this.adaptMetricsForDisplay();
                this.isLoadingMetrics = false;

                // Crear el gráfico después de un pequeño delay para asegurar que el DOM esté listo
                setTimeout(() => this.createRevenueChart(), 100);
            },
            error: (err) => {
                console.error('Error cargando métricas:', err);
                this.metrics = null;
                this.isLoadingMetrics = false;

                const errorMessage = err.error?.message || err.message || 'No se pudieron obtener las métricas.';
                Swal.fire('Error', errorMessage, 'error');
            }
        });
    }

    // ===== TRANSFORMACIÓN DE DATOS =====
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
            },
            {
                icon: 'fas fa-users',
                value: this.formatNumber(m.totalGuests),
                label: 'Total de Huéspedes'
            },
            {
                icon: 'fas fa-dollar-sign',
                value: this.formatNumber(m.averageBookingValue) + ' COP',
                label: 'Valor Promedio por Reserva'
            }
        ];
    }

    // ===== CREACIÓN DEL GRÁFICO =====
    createRevenueChart(): void {
        const canvas = document.getElementById('ingresosChart') as HTMLCanvasElement;
        if (!canvas) {
            console.error('Canvas no encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crear gradiente como en el diseño original
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(185, 116, 121, 0.6)');
        gradient.addColorStop(1, 'rgba(185, 116, 121, 0.1)');

        // Generar datos de ejemplo para los últimos 6 meses
        const months = this.generateMonthLabels();
        const revenueData = this.generateRevenueData();

        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Ingresos',
                    data: revenueData,
                    backgroundColor: gradient,
                    borderColor: 'rgba(185, 116, 121, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(185, 116, 121, 1)',
                    pointHoverRadius: 7,
                    pointRadius: 5,
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `Ingresos: ${this.formatNumber(value || 0)} COP`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: (value) => {
                                return this.formatNumber(Number(value));
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }

    // ===== GENERACIÓN DE DATOS DE EJEMPLO =====
    generateMonthLabels(): string[] {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const result: string[] = [];
        const currentMonth = new Date().getMonth();

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            result.push(months[monthIndex]);
        }

        return result;
    }

    generateRevenueData(): number[] {
        if (!this.metrics || !this.metrics.totalRevenue) {
            return [0, 0, 0, 0, 0, 0];
        }

        // Distribución simulada de ingresos a lo largo de 6 meses
        const total = this.metrics.totalRevenue;
        const baseValue = total / 6;

        return [
            Math.round(baseValue * 0.8),
            Math.round(baseValue * 0.9),
            Math.round(baseValue * 1.1),
            Math.round(baseValue * 1.2),
            Math.round(baseValue * 0.95),
            Math.round(baseValue * 1.05)
        ];
    }

    // ===== EVENTOS =====
    onAccommodationChange(): void {
        this.loadMetrics();
    }

    onDateRangeChange(): void {
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