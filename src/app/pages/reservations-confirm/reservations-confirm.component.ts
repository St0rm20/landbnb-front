import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BookingService} from '../../services/booking.service';
import {BookingDTO} from '../../models/booking-dto';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';

@Component({
    selector: 'app-reservations-confirm',
    templateUrl: './reservations-confirm.component.html',
    styleUrls: ['./reservations-confirm.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ]
})
export class ReservationsConfirmComponent implements OnInit {

    bookingId: number = 0;
    bookingData: BookingDTO | null = null; // Cambiar a BookingDTO

    cancellationDate = '';
    checkInTime = 'Después de las 3:00 PM';
    checkOutTime = 'Antes de las 11:00 AM';

    isProcessing = false;
    isLoading = true;

    // --- Propiedades del Navbar ---
    dropdownOpen = false;
    userName: string = '';
    userEmail: string = '';
    isLoggedIn: boolean = false;
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    isUser: boolean = false;
    isHost: boolean = false;

    // --- Propiedad para la foto del host ---
    hostPhotoUrl: string = 'assets/imagenes/perfil.png';

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.initializeAuth();
        this.loadUserProfile();

        this.route.params.subscribe(params => {
            this.bookingId = +params['id'];
            if (this.bookingId) {
                this.loadBookingData();
            } else {
                alert('ID de reserva no válido');
                this.router.navigate(['/']);
            }
        });
    }

    /**
     * Inicializa la autenticación y verifica el login
     */
    private initializeAuth(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        this.userRole = this.tokenService.getRole();
        this.userEmail = this.tokenService.getEmail();

        // Determinar si es usuario o host
        this.isUser = this.userRole === 'USER';
        this.isHost = this.userRole === 'HOST';

        if (!this.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
    }

    /**
     * Carga el perfil del usuario para la navbar
     */
    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixImageUrl(data.profilePictureUrl);
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

    /**
     * Carga los datos de la reserva
     */
    loadBookingData(): void {
        this.isLoading = true;

        this.bookingService.getBookingById(this.bookingId).subscribe({
            next: (booking: any) => { // Usar any temporalmente
                this.bookingData = booking;
                this.calculateCancellationDate(booking.checkInDate);
                this.loadHostPhoto();
                this.isLoading = false;
                console.log('Datos de la reserva cargados:', booking);
            },
            error: (error) => {
                console.error('Error al cargar la reserva:', error);
                alert('Error al cargar los datos de la reserva');
                this.isLoading = false;
                this.router.navigate(['/']);
            }
        });
    }

    /**
     * Carga y corrige la URL de la foto del host
     */
    private loadHostPhoto(): void {
        if (!this.bookingData?.accommodation?.host) {
            console.warn('No hay datos del host disponibles');
            this.hostPhotoUrl = 'assets/imagenes/perfil.png';
            return;
        }

        const host = this.bookingData.accommodation.host;
        console.log('Datos del host:', host);

        // Usar photoProfile de UserInfoDTO
        if (host.photoProfile) {
            this.hostPhotoUrl = this.fixImageUrl(host.photoProfile);
            console.log('URL de la foto del host corregida:', this.hostPhotoUrl);
        } else {
            console.warn('El host no tiene foto de perfil configurada');
            this.hostPhotoUrl = 'assets/imagenes/perfil.png';
        }
    }

    /**
     * Obtiene el nombre completo del host
     */
    getHostName(): string {
        if (!this.bookingData?.accommodation?.host) {
            return 'Anfitrión';
        }
        const host = this.bookingData.accommodation.host;
        return `${host.name || ''} ${host.lastName || ''}`.trim() || 'Anfitrión';
    }

    /**
     * Corrige URLs de imágenes (Cloudinary y otras)
     */
    private fixImageUrl(url: string | null | undefined): string {
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            return 'assets/imagenes/perfil.png';
        }

        // Si ya es una URL completa y válida, retornarla
        if (url.startsWith('https://') || url.startsWith('http://')) {
            return url;
        }

        // Si es una ruta relativa de assets, asegurarse de que empiece con assets/
        if (url.startsWith('assets/') || url.startsWith('/assets/')) {
            return url.startsWith('/') ? url : '/' + url;
        }

        // Si es una URL de Cloudinary sin protocolo
        if (url.includes('cloudinary.com') && !url.startsWith('http')) {
            return 'https://' + url;
        }

        // Si es una ruta relativa sin assets
        if (!url.includes('://') && !url.startsWith('/')) {
            return '/assets/' + url;
        }

        return url;
    }

    /**
     * Maneja errores de carga de imagen de perfil del usuario
     */
    handleImageError(event: Event): void {
        const imgElement = event.target as HTMLImageElement;
        console.warn('Error cargando imagen, usando imagen por defecto');
        imgElement.src = 'assets/imagenes/perfil.png';
        imgElement.onerror = null;
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

    /**
     * Obtiene el texto del estado de la reserva
     */
    getStatusText(status: string): string {
        const statusMap: { [key: string]: string } = {
            'PENDING': 'Pendiente',
            'CONFIRMED': 'Confirmada',
            'CANCELLED': 'Cancelada',
            'COMPLETED': 'Completada'
        };
        return statusMap[status] || status;
    }

    goBack(): void {
        if (this.bookingData) {
            this.router.navigate(['/detalle-alojamiento', this.bookingData.accommodation.id]);
        } else {
            this.router.navigate(['/']);
        }
    }

    /**
     * Navegar al perfil del usuario
     */
    goToProfile(): void {
        this.router.navigate(['/profile-user']);
    }

    confirmAndPay(): void {
        if (this.isProcessing || !this.bookingData) return;

        if (this.bookingData.status !== 'PENDING') {
            alert('Esta reserva ya no puede ser confirmada');
            return;
        }

        this.isProcessing = true;

        this.bookingService.confirmBooking(this.bookingId).subscribe({
            next: (response) => {
                this.isProcessing = false;
                alert('¡Reserva confirmada exitosamente!');
                // Redirigir a mis reservas después de confirmar el pago
                this.router.navigate(['/mis-reservas']);
            },
            error: (error) => {
                this.isProcessing = false;
                console.error('Error al confirmar la reserva:', error);
                alert('Error al procesar el pago. Por favor, intenta nuevamente.');
            }
        });
    }

    /**
     * Cerrar dropdown al hacer clic fuera
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    /**
     * Toggle del menú dropdown
     */
    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    /**
     * Cerrar sesión
     */
    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }
}