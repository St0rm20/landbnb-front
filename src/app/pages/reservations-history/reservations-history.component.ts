import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { BookingService, BookingDto } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';

@Component({
    selector: 'app-reservations-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './reservations-history.component.html',
    styleUrls: ['./reservations-history.component.css']
})
export class ReservationsHistoryComponent implements OnInit {
    // UI State
    dropdownOpen = false;
    activeTab: 'activas' | 'pasadas' | 'canceladas' = 'activas';
    isLoading = false;

    // User Data
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    isLoggedIn: boolean = false;

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
        console.log('📋 Componente de historial de reservas cargado');

        // Verificar autenticación
        if (!this.tokenService.isLogged()) {
            this.router.navigate(['/login']);
            return;
        }

        this.isLoggedIn = true;
        this.userEmail = this.tokenService.getEmail();
        this.userRole = this.tokenService.getRole();

        this.loadUserProfile();
        this.loadAllBookings();
    }

    // ===== CARGA DE DATOS =====

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data) => {
                this.userName = data.name;
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

    loadAllBookings(): void {
        this.isLoading = true;

        this.bookingService.getUserBookings().subscribe({
            next: (response: any) => {
                console.log(' Respuesta completa del servicio:', response);

                // Manejar diferentes estructuras de respuesta
                if (response && Array.isArray(response)) {
                    this.allReservations = response;
                } else if (response && response.content && Array.isArray(response.content)) {
                    this.allReservations = response.content;
                } else {
                    console.warn('Estructura de respuesta inesperada:', response);
                    this.allReservations = [];
                }

                console.log('Reservas obtenidas:', this.allReservations.length);
                this.categorizeBookings();
                this.isLoading = false;
            },
            error: (error) => {
                console.error(' Error cargando reservas:', error);
                this.allReservations = [];
                this.isLoading = false;
                this.showError('No se pudieron cargar tus reservas');
            }
        });
    }

    categorizeBookings(): void {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log('=== INICIANDO CATEGORIZACIÓN ===');
        console.log('📅 Fecha actual:', today.toISOString().split('T')[0]);

        this.activeReservations = [];
        this.pastReservations = [];
        this.canceledReservations = [];

        this.allReservations.forEach(booking => {
            const status = booking.status?.toUpperCase();
            const checkInDate = this.parseDate(booking.checkInDate);
            const checkOutDate = this.parseDate(booking.checkOutDate);

            console.log(`🔍 Reserva ${booking.id}:`, {
                status: status,
                checkIn: booking.checkInDate,
                checkOut: booking.checkOutDate,
                accommodation: booking.accommodation?.title
            });

            // 1. Reservas canceladas
            if (status === 'CANCELLED' || status === 'CANCELED') {
                this.canceledReservations.push(booking);
                console.log(`   Categorizada como CANCELADA`);
                return;
            }

            // 2. Reservas completadas
            if (status === 'COMPLETED') {
                this.pastReservations.push(booking);
                console.log(`   Categorizada como PASADA (COMPLETED)`);
                return;
            }

            // 3. Para CONFIRMED y PENDING, verificar fechas
            if (status === 'CONFIRMED' || status === 'PENDING') {
                if (checkOutDate < today) {
                    // Ya pasó la fecha de checkout
                    this.pastReservations.push(booking);
                    console.log(`   Categorizada como PASADA (checkout pasado)`);
                } else {
                    // Todavía está vigente
                    this.activeReservations.push(booking);
                    console.log(`  Categorizada como ACTIVA`);
                }
                return;
            }

            // 4. Estado desconocido - categorizar por fecha
            console.warn(`  ESTADO DESCONOCIDO: ${status}`);
            if (checkOutDate < today) {
                this.pastReservations.push(booking);
            } else {
                this.activeReservations.push(booking);
            }
        });

        console.log('=== RESUMEN FINAL ===');
        console.log(' Activas:', this.activeReservations.length);
        console.log(' Pasadas:', this.pastReservations.length);
        console.log('Canceladas:', this.canceledReservations.length);
    }

    private parseDate(dateString: string): Date {
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day);
        } catch (error) {
            console.error('Error parseando fecha:', dateString, error);
            return new Date();
        }
    }

    // ===== VERIFICACIÓN DE CANCELACIÓN =====

    canCancelReservation(booking: BookingDto): boolean {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkInDate = this.parseDate(booking.checkInDate);

        // Calcular la diferencia en días
        const diffTime = checkInDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Puede cancelar si faltan 2 o más días para el check-in
        return diffDays >= 2;
    }

    getDaysUntilCheckIn(booking: BookingDto): number {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const checkInDate = this.parseDate(booking.checkInDate);

        const diffTime = checkInDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ===== ACCIONES =====

    setActiveTab(tab: 'activas' | 'pasadas' | 'canceladas'): void {
        this.activeTab = tab;
        console.log('📑 Tab activa:', tab);
    }

    cancelReservation(booking: BookingDto): void {
        const daysUntilCheckIn = this.getDaysUntilCheckIn(booking);

        // Verificar si puede cancelar
        if (!this.canCancelReservation(booking)) {
            Swal.fire({
                icon: 'warning',
                title: 'No se puede cancelar',
                html: `
                    <p>Solo puedes cancelar reservas con al menos <strong>2 días de anticipación</strong> 
                    antes del check-in.</p>
                    <p class="mt-3">Check-in: <strong>${this.formatDate(booking.checkInDate)}</strong></p>
                    <p>Días restantes: <strong>${daysUntilCheckIn} día${daysUntilCheckIn !== 1 ? 's' : ''}</strong></p>
                `,
                confirmButtonText: 'Entendido'
            });
            return;
        }

        // Confirmar cancelación
        Swal.fire({
            icon: 'warning',
            title: '¿Cancelar esta reserva?',
            html: `
                <div class="text-left" style="color: #333;">
                    <p><strong>Alojamiento:</strong> ${booking.accommodation.title}</p>
                    <p><strong>Fechas:</strong> ${this.formatDate(booking.checkInDate)} - ${this.formatDate(booking.checkOutDate)}</p>
                    <p><strong>Total:</strong> $${this.formatNumber(booking.totalPrice)} COP</p>
                    <p class="text-muted mt-3">Se procesará el reembolso según los términos y condiciones.</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No, mantener',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.isLoading = true;

                this.bookingService.cancelBooking(booking.id).subscribe({
                    next: (response) => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Reserva Cancelada',
                            text: 'Tu reserva ha sido cancelada exitosamente. Se ha procesado el reembolso.',
                            timer: 2500,
                            showConfirmButton: true
                        });

                        // Recargar las reservas
                        this.loadAllBookings();
                    },
                    error: (error) => {
                        console.error(' Error cancelando reserva:', error);
                        this.isLoading = false;
                        this.showError(
                            error.error?.content ||
                            'No se pudo cancelar la reserva. Por favor, intenta de nuevo.'
                        );
                    }
                });
            }
        });
    }

    viewAccommodation(booking: BookingDto): void {
        if (booking.accommodation?.id) {
            this.router.navigate(['/property-detail', booking.accommodation.id]);
        }
    }

    leaveReview(booking: BookingDto): void {
        Swal.fire({
            icon: 'info',
            title: 'Dejar Reseña',
            html: `
                <div class="text-left" style="color: #333;">
                    <p>Próximamente podrás dejar una reseña para:</p>
                    <p class="mt-3"><strong>${booking.accommodation.title}</strong></p>
                    <p>Check-out: ${this.formatDate(booking.checkOutDate)}</p>
                </div>
            `,
            confirmButtonText: 'Cerrar'
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
        const url = booking.accommodation?.mainImage;
        if (!url) {
            return 'assets/imagenes/logo.png';
        }
        return this.fixCloudinaryUrl(url);
    }

    getTotalReservations(): number {
        return this.activeReservations.length +
            this.pastReservations.length +
            this.canceledReservations.length;
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

    get isHost(): boolean {
        return this.userRole === 'HOST';
    }

    get isUser(): boolean {
        return this.userRole === 'USER';
    }

    // Nuevo método para obtener nombre completo del usuario
    getUserFullName(): string {
        return this.userName || 'Usuario';
    }
}