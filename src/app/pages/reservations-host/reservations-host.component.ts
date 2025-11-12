import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { BookingService, BookingDto } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';

@Component({
    selector: 'app-reservations-host',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './reservations-host.component.html',
    styleUrls: ['./reservations-host.component.css']
})
export class ReservationsHostComponent implements OnInit {
    // UI State
    dropdownOpen = false;
    activeTab: 'activas' | 'pasadas' | 'canceladas' = 'activas';
    isLoading = false;

    // User Data
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    // Reservations Data
    activeReservations: BookingDto[] = [];
    pastReservations: BookingDto[] = [];
    canceledReservations: BookingDto[] = [];

    // Pagination
    currentPage = 0;
    pageSize = 10;

    constructor(
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Verificar autenticación
        if (!this.tokenService.isLogged()) {
            this.router.navigate(['/login']);
            return;
        }

        this.userRole = this.tokenService.getRole();

        // Verificar que sea HOST
        if (this.userRole !== 'HOST') {
            Swal.fire({
                icon: 'warning',
                title: 'Acceso Denegado',
                text: 'Solo los anfitriones pueden acceder a esta sección',
                confirmButtonText: 'Entendido'
            });
            this.router.navigate(['/home']);
            return;
        }

        this.userEmail = this.tokenService.getEmail();
        this.loadUserProfile();
        this.loadBookings();
    }

    // ===== CARGA DE DATOS =====

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
            },
            error: (error) => {
                console.error('Error cargando perfil:', error);
                this.userName = this.userEmail;
            }
        });
    }

    loadBookings(): void {
        this.isLoading = true;

        // Cargar según el tab activo
        switch (this.activeTab) {
            case 'activas':
                this.loadActiveBookings();
                break;
            case 'pasadas':
                this.loadPastBookings();
                break;
            case 'canceladas':
                this.loadCanceledBookings();
                break;
        }
    }

    loadActiveBookings(): void {
        // Obtener reservas PENDING y CONFIRMED
        this.bookingService.getHostBookings(undefined, 'CONFIRMED', this.currentPage, this.pageSize).subscribe({
            next: (response) => {
                this.activeReservations = response.content;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando reservas activas:', error);
                this.activeReservations = [];
                this.isLoading = false;
                this.showError('No se pudieron cargar las reservas activas');
            }
        });
    }

    loadPastBookings(): void {
        // Obtener reservas COMPLETED
        this.bookingService.getHostBookings(undefined, 'COMPLETED', this.currentPage, this.pageSize).subscribe({
            next: (response) => {
                this.pastReservations = response.content;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando reservas pasadas:', error);
                this.pastReservations = [];
                this.isLoading = false;
                this.showError('No se pudieron cargar las reservas pasadas');
            }
        });
    }

    loadCanceledBookings(): void {
        // Obtener reservas CANCELLED
        this.bookingService.getHostBookings(undefined, 'CANCELLED', this.currentPage, this.pageSize).subscribe({
            next: (response) => {
                this.canceledReservations = response.content;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando reservas canceladas:', error);
                this.canceledReservations = [];
                this.isLoading = false;
                this.showError('No se pudieron cargar las reservas canceladas');
            }
        });
    }

    // ===== ACCIONES =====

    setActiveTab(tab: 'activas' | 'pasadas' | 'canceladas'): void {
        this.activeTab = tab;
        this.currentPage = 0;
        this.loadBookings();
    }

    contactGuest(booking: BookingDto): void {
        const guestName = `${booking.user.name} ${booking.user.lastName}`;
        const guestEmail = booking.user.email;
        const guestPhone = booking.user.phoneNumber || 'No disponible';

        Swal.fire({
            icon: 'info',
            title: `Contactar a ${guestName}`,
            html: `
                <div class="text-left">
                    <p><strong>Email:</strong> <a href="mailto:${guestEmail}">${guestEmail}</a></p>
                    <p><strong>Teléfono:</strong> ${guestPhone}</p>
                    <p><strong>Alojamiento:</strong> ${booking.accommodation.title}</p>
                    <p><strong>Fechas:</strong> ${this.formatDate(booking.checkInDate)} - ${this.formatDate(booking.checkOutDate)}</p>
                </div>
            `,
            confirmButtonText: 'Cerrar'
        });
    }

    viewReview(booking: BookingDto): void {
        // Por ahora mostramos la información de la reserva
        // Más adelante puedes agregar un servicio de reviews
        Swal.fire({
            icon: 'info',
            title: 'Reserva Completada',
            html: `
                <div class="text-left">
                    <p><strong>Huésped:</strong> ${booking.user.name} ${booking.user.lastName}</p>
                    <p><strong>Alojamiento:</strong> ${booking.accommodation.title}</p>
                    <p><strong>Fechas:</strong> ${this.formatDate(booking.checkInDate)} - ${this.formatDate(booking.checkOutDate)}</p>
                    <p><strong>Total:</strong> $${this.formatNumber(booking.totalPrice)} COP</p>
                    <p class="text-muted mt-3">El sistema de reseñas estará disponible próximamente.</p>
                </div>
            `,
            confirmButtonText: 'Cerrar'
        });
    }

    cancelBookingAsHost(booking: BookingDto): void {
        Swal.fire({
            icon: 'warning',
            title: '¿Cancelar esta reserva?',
            text: `Se cancelará la reserva de ${booking.user.name} para ${booking.accommodation.title}`,
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.bookingService.cancelBookingByHost(booking.id).subscribe({
                    next: (response) => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Reserva Cancelada',
                            text: response.description,
                            timer: 2000
                        });
                        this.loadBookings();
                    },
                    error: (error) => {
                        this.showError('No se pudo cancelar la reserva');
                    }
                });
            }
        });
    }

    // ===== UTILIDADES =====

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatNumber(value: number): string {
        return Math.round(value).toLocaleString('es-CO');
    }

    getStatusBadgeClass(status: string): string {
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return 'badge-success';
            case 'PENDING':
                return 'badge-warning';
            case 'CANCELLED':
                return 'badge-danger';
            case 'COMPLETED':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    }

    getStatusText(status: string): string {
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return 'Confirmada';
            case 'PENDING':
                return 'Pendiente';
            case 'CANCELLED':
                return 'Cancelada';
            case 'COMPLETED':
                return 'Completada';
            default:
                return status;
        }
    }

    getImageUrl(booking: BookingDto): string {
        return booking.accommodation.mainImage || 'assets/imagenes/default-accommodation.jpg';
    }

    showError(message: string): void {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'Entendido'
        });
    }

    // ===== NAVBAR =====

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

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }
}