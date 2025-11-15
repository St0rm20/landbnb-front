import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { BookingService, BookingDto } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { CommentService, ReviewRequest } from '../../services/comment-service';

@Component({
    selector: 'app-reservations-history',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
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
        private commentService: CommentService,
        private router: Router
    ) {}

    ngOnInit(): void {
        console.log('📋 Componente de historial de reservas cargado');

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
                console.log('✅ Respuesta completa del servicio:', response);

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
                console.error('❌ Error cargando reservas:', error);
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

            if (status === 'CANCELLED' || status === 'CANCELED') {
                this.canceledReservations.push(booking);
                console.log(`   ➡️ Categorizada como CANCELADA`);
                return;
            }

            if (status === 'COMPLETED') {
                this.pastReservations.push(booking);
                console.log(`   ➡️ Categorizada como PASADA (COMPLETED)`);
                return;
            }

            if (status === 'CONFIRMED' || status === 'PENDING') {
                if (checkOutDate < today) {
                    this.pastReservations.push(booking);
                    console.log(`   ➡️ Categorizada como PASADA (checkout pasado)`);
                } else {
                    this.activeReservations.push(booking);
                    console.log(`  ✅ Categorizada como ACTIVA`);
                }
                return;
            }

            console.warn(`⚠️  ESTADO DESCONOCIDO: ${status}`);
            if (checkOutDate < today) {
                this.pastReservations.push(booking);
            } else {
                this.activeReservations.push(booking);
            }
        });

        console.log('=== RESUMEN FINAL ===');
        console.log('✅ Activas:', this.activeReservations.length);
        console.log('📜 Pasadas:', this.pastReservations.length);
        console.log('❌ Canceladas:', this.canceledReservations.length);
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

        const diffTime = checkInDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

                        this.loadAllBookings();
                    },
                    error: (error) => {
                        console.error('❌ Error cancelando reserva:', error);
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
        console.log('🏠 Navegando al alojamiento:', booking.accommodation);
        if (booking.accommodation?.id) {
            console.log('📍 ID del alojamiento:', booking.accommodation.id);
            this.router.navigate(['/detalle-alojamiento', booking.accommodation.id]).then(
                () => console.log('✅ Navegación exitosa'),
                (error) => console.error('❌ Error en navegación:', error)
            );
        } else {
            console.error('❌ No se encontró ID del alojamiento');
            this.showError('No se pudo cargar la información del alojamiento');
        }
    }

    async leaveReview(booking: BookingDto): Promise<void> {
        const { value: formValues } = await Swal.fire({
            title: 'Dejar una Reseña',
            html: `
                <div style="text-align: left;">
                    <p style="margin-bottom: 10px;"><strong>${booking.accommodation.title}</strong></p>
                    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                        Estadía: ${this.formatDate(booking.checkInDate)} - ${this.formatDate(booking.checkOutDate)}
                    </p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Calificación:</label>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button type="button" class="rating-btn" data-rating="1" style="font-size: 30px; background: none; border: none; cursor: pointer; color: #ddd;">★</button>
                            <button type="button" class="rating-btn" data-rating="2" style="font-size: 30px; background: none; border: none; cursor: pointer; color: #ddd;">★</button>
                            <button type="button" class="rating-btn" data-rating="3" style="font-size: 30px; background: none; border: none; cursor: pointer; color: #ddd;">★</button>
                            <button type="button" class="rating-btn" data-rating="4" style="font-size: 30px; background: none; border: none; cursor: pointer; color: #ddd;">★</button>
                            <button type="button" class="rating-btn" data-rating="5" style="font-size: 30px; background: none; border: none; cursor: pointer; color: #ddd;">★</button>
                        </div>
                        <input type="hidden" id="rating-value" value="0">
                    </div>
                    
                    <div>
                        <label for="review-text" style="display: block; margin-bottom: 8px; font-weight: 600;">Comentario:</label>
                        <textarea 
                            id="review-text" 
                            class="swal2-textarea" 
                            placeholder="Cuéntanos sobre tu experiencia..."
                            style="width: 100%; min-height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                        ></textarea>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Enviar Reseña',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4a675f',
            cancelButtonColor: '#6c757d',
            didOpen: () => {
                const ratingButtons = document.querySelectorAll('.rating-btn');
                const ratingInput = document.getElementById('rating-value') as HTMLInputElement;

                ratingButtons.forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const target = e.currentTarget as HTMLElement;
                        const rating = parseInt(target.getAttribute('data-rating') || '0');
                        ratingInput.value = rating.toString();

                        ratingButtons.forEach((b, index) => {
                            const button = b as HTMLElement;
                            if (index < rating) {
                                button.style.color = '#ffc107';
                            } else {
                                button.style.color = '#ddd';
                            }
                        });
                    });
                });
            },
            preConfirm: () => {
                const rating = parseInt((document.getElementById('rating-value') as HTMLInputElement).value);
                const text = (document.getElementById('review-text') as HTMLTextAreaElement).value;

                if (rating === 0) {
                    Swal.showValidationMessage('Por favor selecciona una calificación');
                    return null;
                }

                if (!text || text.trim().length < 10) {
                    Swal.showValidationMessage('El comentario debe tener al menos 10 caracteres');
                    return null;
                }

                return { rating, text };
            }
        });

        if (formValues) {
            const reviewRequest: ReviewRequest = {
                bookingId: booking.id,
                rating: formValues.rating,
                text: formValues.text
            };

            console.log('📝 Enviando reseña:', reviewRequest);

            // Mostrar loading
            Swal.fire({
                title: 'Enviando reseña...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            this.commentService.createReview(reviewRequest).subscribe({
                next: (response) => {
                    console.log('✅ Reseña creada exitosamente:', response);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Reseña Enviada!',
                        text: 'Tu reseña ha sido publicada exitosamente. ¡Gracias por compartir tu experiencia!',
                        confirmButtonText: 'Cerrar',
                        confirmButtonColor: '#4a675f'
                    });
                },
                error: (error) => {
                    console.error('❌ Error completo:', error);
                    console.error('❌ Error status:', error.status);
                    console.error('❌ Error message:', error.message);
                    console.error('❌ Error error:', error.error);

                    let errorMessage = 'No se pudo enviar tu reseña. Por favor, intenta de nuevo.';

                    if (error.error) {
                        if (typeof error.error === 'string') {
                            errorMessage = error.error;
                        } else if (error.error.message) {
                            errorMessage = error.error.message;
                        } else if (error.error.content) {
                            errorMessage = error.error.content;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    if (error.status === 0) {
                        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
                    } else if (error.status === 404) {
                        errorMessage = 'El servicio de comentarios no está disponible.';
                    } else if (error.status === 400) {
                        errorMessage = errorMessage || 'Datos inválidos. Verifica la información.';
                    } else if (error.status === 403) {
                        errorMessage = 'No tienes permiso para dejar esta reseña.';
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'Error al Enviar Reseña',
                        text: errorMessage,
                        confirmButtonText: 'Cerrar',
                        confirmButtonColor: '#d33'
                    });
                }
            });
        }
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

    getUserFullName(): string {
        return this.userName || 'Usuario';
    }
}