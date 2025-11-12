import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { BookingService, BookingDto, PagedBookings } from '../../services/booking.service';
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
    allReservations: BookingDto[] = [];
    activeReservations: BookingDto[] = [];
    pastReservations: BookingDto[] = [];
    canceledReservations: BookingDto[] = [];

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
        this.loadAllBookings();
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

    loadAllBookings(): void {
        this.isLoading = true;

        // Obtener TODAS las reservas sin filtrar por estado
        this.bookingService.getHostBookings().subscribe({
            next: (response: PagedBookings | any) => {
                console.log('Respuesta completa del servicio:', response);

                // Manejar diferentes estructuras de respuesta
                if (response && Array.isArray(response)) {
                    // Si la respuesta es directamente un array
                    this.allReservations = response;
                } else if (response && response.content && Array.isArray(response.content)) {
                    // Si la respuesta tiene propiedad content (estructura paginada)
                    this.allReservations = response.content;
                } else if (response && Array.isArray(response)) {
                    // Otra posible estructura
                    this.allReservations = response;
                } else {
                    console.warn('Estructura de respuesta inesperada:', response);
                    this.allReservations = [];
                }

                console.log('Reservas obtenidas:', this.allReservations.length, this.allReservations);
                this.categorizeBookings();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error cargando todas las reservas:', error);
                this.allReservations = [];
                this.isLoading = false;
                this.showError('No se pudieron cargar las reservas');
            }
        });
    }

    categorizeBookings(): void {
        const now = new Date();

        this.activeReservations = this.allReservations.filter(booking => {
            const status = booking.status?.toUpperCase();
            const checkOutDate = new Date(booking.checkOutDate);

            // Reservas activas: CONFIRMED o PENDING con checkOutDate en el futuro
            return (status === 'CONFIRMED' || status === 'PENDING') && checkOutDate >= now;
        });

        this.pastReservations = this.allReservations.filter(booking => {
            const status = booking.status?.toUpperCase();
            const checkOutDate = new Date(booking.checkOutDate);

            // Reservas pasadas: COMPLETED o CONFIRMED con checkOutDate en el pasado
            return status === 'COMPLETED' ||
                (status === 'CONFIRMED' && checkOutDate < now);
        });

        this.canceledReservations = this.allReservations.filter(booking => {
            const status = booking.status?.toUpperCase();
            return status === 'CANCELLED' || status === 'CANCELED';
        });

        console.log('Reservas activas:', this.activeReservations.length);
        console.log('Reservas pasadas:', this.pastReservations.length);
        console.log('Reservas canceladas:', this.canceledReservations.length);
    }

    // ===== ACCIONES =====

    setActiveTab(tab: 'activas' | 'pasadas' | 'canceladas'): void {
        this.activeTab = tab;
    }

    contactGuest(booking: BookingDto): void {
        console.log('Datos del booking para contactar:', booking); // Para debugging

        const guestName = `${booking.user.name} ${booking.user.lastName}`;

        // Verificar diferentes posibles ubicaciones del email
        const guestEmail = booking.user.email ||
            booking.user.email ||
            (booking.user as any).emailAddress ||
            'Email no disponible';

        const guestPhone = booking.user.phoneNumber ||
            booking.user.phoneNumber ||
            (booking.user as any).phone ||
            'No disponible';

        Swal.fire({
            icon: 'info',
            title: `Contactar a ${guestName}`,
            html: `
            <div class="text-left" style="color: #333;">
                <p><strong>Email:</strong> 
                    ${guestEmail !== 'Email no disponible' ?
                `<a href="mailto:${guestEmail}" style="color: #007bff;">${guestEmail}</a>` :
                'Email no disponible'}
                </p>
                <p><strong>Teléfono:</strong> ${guestPhone}</p>
                <p><strong>Alojamiento:</strong> ${booking.accommodation.title}</p>
                <p><strong>Fechas:</strong> ${this.formatDate(booking.checkInDate)} - ${this.formatDate(booking.checkOutDate)}</p>
            </div>
        `,
            confirmButtonText: 'Cerrar',
            customClass: {
                popup: 'contact-popup'
            }
        });
    }

    viewReview(booking: BookingDto): void {
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
                        // Recargar todas las reservas
                        this.loadAllBookings();
                    },
                    error: (error) => {
                        console.error('Error cancelando reserva:', error);
                        this.showError('No se pudo cancelar la reserva');
                    }
                });
            }
        });
    }

    // ===== UTILIDADES =====

    formatDate(dateString: string): string {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    formatNumber(value: number): string {
        return Math.round(value).toLocaleString('es-CO');
    }

    getStatusBadgeClass(status: string): string {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'CONFIRMED':
                return 'badge-success';
            case 'PENDING':
                return 'badge-warning';
            case 'CANCELLED':
            case 'CANCELED':
                return 'badge-danger';
            case 'COMPLETED':
                return 'badge-secondary';
            default:
                return 'badge-secondary';
        }
    }

    getStatusText(status: string): string {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'CONFIRMED':
                return 'Confirmada';
            case 'PENDING':
                return 'Pendiente';
            case 'CANCELLED':
            case 'CANCELED':
                return 'Cancelada';
            case 'COMPLETED':
                return 'Completada';
            default:
                return status || 'Desconocido';
        }
    }

    getImageUrl(booking: BookingDto): string {
        return booking.accommodation?.mainImage || 'assets/imagenes/default-accommodation.jpg';
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