// ============================================
// reservations-confirm.component.ts
// ============================================
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BookingService, BookingDto } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-reservations-confirm',
    templateUrl: './reservations-confirm.component.html',
    styleUrls: ['./reservations-confirm.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class ReservationsConfirmComponent implements OnInit {

    bookingId: number = 0;
    bookingData: BookingDto | null = null;

    cancellationDate = '';
    checkInTime = 'Después de las 3:00 PM';
    checkOutTime = 'Antes de las 11:00 AM';

    isProcessing = false;
    isLoading = true;

    // Navbar properties
    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    hostPhotoUrl: string = '';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.checkAuthentication();

        this.route.params.subscribe(params => {
            this.bookingId = +params['id'];
            if (this.bookingId) {
                this.loadBookingData();
            } else {
                Swal.fire('Error', 'ID de reserva no válido', 'error');
                this.router.navigate(['/home']);
            }
        });
    }

    // ===== AUTENTICACIÓN Y PERFIL =====
    checkAuthentication(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.userName = '';
            this.userEmail = '';
            this.userRole = '';
            this.profilePicUrl = 'assets/imagenes/perfil.png';
        }
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = data.name;
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error: any) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = '';
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

    get isHost(): boolean {
        return this.userRole === 'HOST';
    }

    get isUser(): boolean {
        return this.userRole === 'USER';
    }

    // ===== DROPDOWN =====
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

    // ===== CARGA DE DATOS =====
    loadBookingData(): void {
        this.isLoading = true;

        this.bookingService.getBookingById(this.bookingId).subscribe({
            next: (booking: BookingDto) => {
                this.bookingData = booking;

                // Procesar foto del host
                if (this.bookingData.accommodation?.host?.photoProfile) {
                    this.hostPhotoUrl = this.fixCloudinaryUrl(
                        this.bookingData.accommodation.host.photoProfile
                    );
                }

                this.calculateCancellationDate(booking.checkInDate);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar la reserva:', error);
                Swal.fire('Error', 'No se pudieron cargar los datos de la reserva', 'error');
                this.isLoading = false;
                this.router.navigate(['/home']);
            }
        });
    }

    calculateCancellationDate(checkInDate: string): void {
        const checkIn = new Date(checkInDate);
        checkIn.setHours(checkIn.getHours() - 48);
        this.cancellationDate = this.formatDateWithTime(checkIn);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
            'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    }

    formatDateWithTime(date: Date): string {
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()} a las ${hours}:00 ${ampm}`;
    }

    calculateNights(): number {
        if (!this.bookingData) return 0;
        const checkIn = new Date(this.bookingData.checkInDate);
        const checkOut = new Date(this.bookingData.checkOutDate);
        return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }

    calculateServiceFee(): number {
        if (!this.bookingData) return 0;
        return this.bookingData.totalPrice * 0.10;
    }

    calculateSubtotal(): number {
        if (!this.bookingData) return 0;
        return this.bookingData.totalPrice - this.calculateServiceFee();
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    goBack(): void {
        if (this.bookingData) {
            this.router.navigate(['/detalle-alojamiento', this.bookingData.accommodation.id]);
        } else {
            this.router.navigate(['/home']);
        }
    }

    confirmAndPay(): void {
        if (this.isProcessing || !this.bookingData) return;

        if (this.bookingData.status !== 'PENDING') {
            Swal.fire('Error', 'Esta reserva ya no puede ser confirmada', 'warning');
            return;
        }

        this.isProcessing = true;

        this.bookingService.confirmBooking(this.bookingId).subscribe({
            next: (response) => {
                this.isProcessing = false;
                Swal.fire({
                    icon: 'success',
                    title: '¡Reserva confirmada!',
                    text: 'Tu reserva ha sido confirmada exitosamente',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    this.router.navigate(['/reservations-history']);
                });
            },
            error: (error) => {
                this.isProcessing = false;
                console.error('Error al confirmar la reserva:', error);
                Swal.fire('Error', 'No se pudo procesar el pago. Por favor, intenta nuevamente.', 'error');
            }
        });
    }
}