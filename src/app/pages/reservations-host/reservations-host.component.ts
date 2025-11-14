import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';

import { BookingService, BookingDto, PagedBookings } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';

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
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    // Reservations Data
    allReservations: BookingDto[] = [];
    activeReservations: BookingDto[] = [];
    pastReservations: BookingDto[] = [];
    canceledReservations: BookingDto[] = [];

    constructor(
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService,
        private router: Router,
        private sanitizer: DomSanitizer
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
            next: (data: UserDto) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error) => {
                console.error('Error cargando perfil:', error);
                this.userName = this.userEmail;
                this.profilePicUrl = 'assets/imagenes/perfil.png';
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
        console.warn('Error cargando imagen de perfil, usando imagen por defecto');
        imgElement.src = 'assets/imagenes/perfil.png';
        imgElement.onerror = null;
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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log('=== INICIANDO CATEGORIZACIÓN ===');
        console.log('Fecha actual:', today.toISOString().split('T')[0]);

        this.activeReservations = [];
        this.pastReservations = [];
        this.canceledReservations = [];

        this.allReservations.forEach(booking => {
            const status = booking.status?.toUpperCase();
            const checkInDate = this.parseDate(booking.checkInDate);
            const checkOutDate = this.parseDate(booking.checkOutDate);

            console.log(`Reserva ${booking.id}:`, {
                status: status,
                checkIn: booking.checkInDate,
                checkOut: booking.checkOutDate,
                parsedCheckIn: checkInDate.toISOString().split('T')[0],
                parsedCheckOut: checkOutDate.toISOString().split('T')[0],
                isCheckOutValid: checkOutDate >= checkInDate
            });

            // Primero: Reservas canceladas (independiente de las fechas)
            if (status === 'CANCELLED' || status === 'CANCELED') {
                this.canceledReservations.push(booking);
                console.log(`  -> Categorizada como CANCELADA`);
                return;
            }

            // Segundo: Reservas COMPLETED (independiente de las fechas)
            if (status === 'COMPLETED') {
                this.pastReservations.push(booking);
                console.log(`  -> Categorizada como PASADA (COMPLETED)`);
                return;
            }

            // Para CONFIRMED y PENDING, verificar fechas
            if (status === 'CONFIRMED' || status === 'PENDING') {
                // Validar que las fechas sean coherentes
                if (checkOutDate < checkInDate) {
                    console.warn(`  -> FECHAS INCONSISTENTES: checkOut antes de checkIn`);
                    // Si las fechas son inconsistentes, tratar como pasada si el checkOut ya pasó
                    if (checkOutDate < today) {
                        this.pastReservations.push(booking);
                        console.log(`  -> Categorizada como PASADA (fechas inconsistentes)`);
                    } else {
                        this.activeReservations.push(booking);
                        console.log(`  -> Categorizada como ACTIVA (fechas inconsistentes)`);
                    }
                    return;
                }

                // Fechas coherentes - categorizar normalmente
                if (checkOutDate >= today) {
                    this.activeReservations.push(booking);
                    console.log(`  -> Categorizada como ACTIVA`);
                } else {
                    this.pastReservations.push(booking);
                    console.log(`  -> Categorizada como PASADA`);
                }
                return;
            }

            // Estado desconocido - categorizar por fecha de checkOut
            console.warn(`  -> ESTADO DESCONOCIDO: ${status}`);
            if (checkOutDate < today) {
                this.pastReservations.push(booking);
                console.log(`  -> Categorizada como PASADA (estado desconocido)`);
            } else {
                this.activeReservations.push(booking);
                console.log(`  -> Categorizada como ACTIVA (estado desconocido)`);
            }
        });

        console.log('=== RESUMEN FINAL ===');
        console.log('Activas:', this.activeReservations.length);
        console.log('Pasadas:', this.pastReservations.length);
        console.log('Canceladas:', this.canceledReservations.length);
    }

    private parseDate(dateString: string): Date {
        try {
            // Parsear la fecha en formato YYYY-MM-DD
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11
        } catch (error) {
            console.error('Error parseando fecha:', dateString, error);
            return new Date(); // Fallback a fecha actual
        }
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
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);

            return date.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formateando fecha:', dateString, error);
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