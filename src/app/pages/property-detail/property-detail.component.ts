import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MapService } from '../../services/map-service';
import { AccommodationService } from '../../services/accommodation-service.service';
import { BookingService, BookingRequest } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { CommentService, CommentDTO } from '../../services/comment-service';
import { AccommodationDetailDTO } from '../../models/accommodation-detail-dto';
import Swal from 'sweetalert2';

interface Review {
    user: string;
    date: string;
    comment: string;
    avatar: string;
}

interface UnavailableDate {
    checkInDate: string;
    checkOutDate: string;
}

@Component({
    selector: 'app-property-detail',
    templateUrl: './property-detail.component.html',
    styleUrls: ['./property-detail.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class PropertyDetailComponent implements OnInit, AfterViewInit {
    reservationForm: FormGroup;
    reviewForm: FormGroup;
    dropdownOpen = false;
    accommodationId: number = 0;
    property: AccommodationDetailDTO | null = null;
    isFavorite: boolean = false;
    isLoadingFavorite: boolean = false;
    unavailableDates: UnavailableDate[] = [];

    // Fechas seleccionadas
    selectedCheckIn: string | null = null;
    selectedCheckOut: string | null = null;

    // Calendario
    currentMonth: Date = new Date();
    calendarDays: any[] = [];

    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';

    reviews: CommentDTO[] = [];
    showReviewForm: boolean = false;
    isSubmittingReview: boolean = false;
    reviewRating: number = 0;
    reviewComment: string = '';

    serviceFee = 65000;
    nights = 0;

    minDate: string = '';

    // Galería de imágenes
    showImageModal: boolean = false;
    currentImageIndex: number = 0;
    allImages: string[] = [];

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private mapService: MapService,
        private accommodationService: AccommodationService,
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService,
        private commentService: CommentService
    ) {
        this.reservationForm = this.fb.group({
            guests: ['1', Validators.required]
        });

        this.reviewForm = this.fb.group({
            rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
            comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
        });
    }

    ngOnInit(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        }

        this.route.params.subscribe(params => {
            this.accommodationId = +params['id'];
            if (this.accommodationId) {
                this.loadAccommodationDetails();
                this.loadUnavailableDates();
                this.loadPropertyReviews();
                if (this.isLoggedIn) {
                    this.checkIfFavorite();
                }
            }
        });

        this.initializeDates();
        this.generateCalendar();
    }

    ngAfterViewInit(): void {
        // El mapa se inicializará después de cargar los detalles
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data) => {
                this.userName = data.name;
            },
            error: (error) => {
                console.error("Error cargando perfil del usuario", error);
                this.userName = '';
            }
        });
    }

    loadAccommodationDetails(): void {
        this.accommodationService.getById(this.accommodationId).subscribe({
            next: (data: AccommodationDetailDTO) => {
                this.property = data;
                console.log('Alojamiento cargado:', this.property);

                // Preparar array de todas las imágenes
                this.allImages = [];
                if (this.property.mainImage) {
                    this.allImages.push(this.property.mainImage);
                }
                if (this.property.images && this.property.images.length > 0) {
                    this.allImages.push(...this.property.images.filter(img => img !== this.property?.mainImage));
                }

                // Actualizar el combo de huéspedes
                this.updateGuestsOptions();

                // Inicializar mapa
                setTimeout(() => {
                    if (this.property) {
                        this.initializeMap();
                    }
                }, 100);
            },
            error: (error) => {
                console.error('Error al cargar detalles:', error);
                Swal.fire('Error', 'No se pudo cargar la información del alojamiento', 'error');
            }
        });
    }

    loadPropertyReviews(): void {
        this.commentService.getAccommodationComments(this.accommodationId, 0, 10).subscribe({
            next: (response) => {
                this.reviews = response.content || [];
                console.log('Reseñas cargadas:', this.reviews);
            },
            error: (error) => {
                console.error('Error al cargar reseñas:', error);
                this.reviews = [];
            }
        });
    }

    loadUnavailableDates(): void {
        this.accommodationService.getUnavailableDates(this.accommodationId).subscribe({
            next: (dates: UnavailableDate[]) => {
                this.unavailableDates = dates;
                console.log('Fechas no disponibles:', this.unavailableDates);
                this.generateCalendar();
            },
            error: (error) => {
                console.error('Error al cargar fechas no disponibles:', error);
            }
        });
    }

    checkIfFavorite(): void {
        this.accommodationService.isFavorite(this.accommodationId).subscribe({
            next: (result: boolean) => {
                this.isFavorite = result;
            },
            error: (error) => {
                console.error('Error al verificar favorito:', error);
            }
        });
    }

    toggleFavorite(): void {
        if (!this.isLoggedIn) {
            Swal.fire({
                icon: 'info',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para agregar favoritos'
            });
            return;
        }

        this.isLoadingFavorite = true;

        if (this.isFavorite) {
            this.accommodationService.removeFavorite(this.accommodationId).subscribe({
                next: (response) => {
                    this.isFavorite = false;
                    this.isLoadingFavorite = false;
                    Swal.fire({
                        icon: 'success',
                        title: response.content || 'Eliminado de favoritos',
                        timer: 1500,
                        showConfirmButton: false
                    });
                },
                error: (error) => {
                    console.error('Error al eliminar favorito:', error);
                    this.isLoadingFavorite = false;
                    Swal.fire('Error', 'No se pudo eliminar de favoritos', 'error');
                }
            });
        } else {
            this.accommodationService.addFavorite(this.accommodationId).subscribe({
                next: (response) => {
                    this.isFavorite = true;
                    this.isLoadingFavorite = false;
                    Swal.fire({
                        icon: 'success',
                        title: response.content || 'Agregado a favoritos',
                        timer: 1500,
                        showConfirmButton: false
                    });
                },
                error: (error) => {
                    console.error('Error al agregar favorito:', error);
                    this.isLoadingFavorite = false;
                    Swal.fire('Error', 'No se pudo agregar a favoritos', 'error');
                }
            });
        }
    }

    initializeMap(): void {
        if (!this.property) return;

        const propertyLocation: [number, number] = [
            this.property.longitude,
            this.property.latitude
        ];

        this.mapService.initializeMap('map', propertyLocation, 14);

        this.mapService.addMarker({
            id: this.property.id,
            title: this.property.title,
            photoUrl: this.property.mainImage,
            location: {
                latitude: this.property.latitude,
                longitude: this.property.longitude
            }
        });
    }

    updateGuestsOptions(): void {
        if (!this.property) return;
        // El HTML generará las opciones dinámicamente basándose en maxCapacity
    }

    getGuestsArray(): number[] {
        if (!this.property) return [1];
        return Array.from({ length: this.property.maxCapacity }, (_, i) => i + 1);
    }

    /** ---------------- CALENDARIO ---------------- */
    initializeDates(): void {
        const today = new Date();
        this.minDate = this.formatDate(today);
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }

    generateCalendar(): void {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        this.calendarDays = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const dateString = this.formatDate(currentDate);
            const isPast = currentDate < today;
            const isCurrentMonth = currentDate.getMonth() === month;
            const isUnavailable = this.isDateUnavailable(dateString);
            const isSelected = this.isDateSelected(dateString);
            const isInRange = this.isDateInRange(dateString);

            this.calendarDays.push({
                date: currentDate,
                dateString: dateString,
                day: currentDate.getDate(),
                isCurrentMonth: isCurrentMonth,
                isPast: isPast,
                isUnavailable: isUnavailable,
                isSelected: isSelected,
                isInRange: isInRange,
                isDisabled: isPast || isUnavailable
            });
        }
    }

    isDateUnavailable(dateString: string): boolean {
        return this.unavailableDates.some(range => {
            const checkIn = new Date(range.checkInDate);
            const checkOut = new Date(range.checkOutDate);
            const current = new Date(dateString);

            return current >= checkIn && current <= checkOut;
        });
    }

    isDateSelected(dateString: string): boolean {
        return dateString === this.selectedCheckIn || dateString === this.selectedCheckOut;
    }

    isDateInRange(dateString: string): boolean {
        if (!this.selectedCheckIn || !this.selectedCheckOut) return false;

        const current = new Date(dateString);
        const checkIn = new Date(this.selectedCheckIn);
        const checkOut = new Date(this.selectedCheckOut);

        return current > checkIn && current < checkOut;
    }

    onDateClick(day: any): void {
        if (day.isDisabled) return;

        if (!this.selectedCheckIn || (this.selectedCheckIn && this.selectedCheckOut)) {
            // Primera selección o reiniciar
            this.selectedCheckIn = day.dateString;
            this.selectedCheckOut = null;
        } else {
            // Segunda selección
            const checkIn = new Date(this.selectedCheckIn);
            const selected = new Date(day.dateString);

            if (selected > checkIn) {
                // Verificar que no haya fechas no disponibles en el rango
                if (!this.hasUnavailableDatesInRange(this.selectedCheckIn, day.dateString)) {
                    this.selectedCheckOut = day.dateString;
                    this.updateNights();
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Fechas no disponibles',
                        text: 'Hay fechas reservadas en el rango seleccionado',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    this.selectedCheckIn = day.dateString;
                    this.selectedCheckOut = null;
                }
            } else {
                this.selectedCheckIn = day.dateString;
                this.selectedCheckOut = null;
            }
        }

        this.generateCalendar();
    }

    hasUnavailableDatesInRange(checkIn: string, checkOut: string): boolean {
        const start = new Date(checkIn);
        const end = new Date(checkOut);

        return this.unavailableDates.some(range => {
            const unavailStart = new Date(range.checkInDate);
            const unavailEnd = new Date(range.checkOutDate);

            return (unavailStart > start && unavailStart < end) ||
                (unavailEnd > start && unavailEnd < end) ||
                (unavailStart <= start && unavailEnd >= end);
        });
    }

    previousMonth(): void {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() - 1,
            1
        );
        this.generateCalendar();
    }

    nextMonth(): void {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear(),
            this.currentMonth.getMonth() + 1,
            1
        );
        this.generateCalendar();
    }

    getMonthYearDisplay(): string {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${months[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    }

    updateNights(): void {
        if (!this.selectedCheckIn || !this.selectedCheckOut) {
            this.nights = 0;
            return;
        }

        const checkIn = new Date(this.selectedCheckIn);
        const checkOut = new Date(this.selectedCheckOut);
        const diff = checkOut.getTime() - checkIn.getTime();
        this.nights = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    }

    /** ---------------- RESERVAS ---------------- */
    calculateSubtotal(): number {
        if (!this.property) return 0;
        return this.property.pricePerNight * this.nights;
    }

    calculateTotal(): number {
        return this.calculateSubtotal() + this.serviceFee;
    }

    canReserve(): boolean {
        return this.reservationForm.valid &&
            this.selectedCheckIn !== null &&
            this.selectedCheckOut !== null &&
            this.nights > 0;
    }

    onReserve(): void {
        if (!this.isLoggedIn) {
            Swal.fire({
                icon: 'info',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para realizar una reserva'
            });
            return;
        }

        if (!this.selectedCheckIn || !this.selectedCheckOut) {
            Swal.fire({
                icon: 'warning',
                title: 'Selecciona las fechas',
                text: 'Por favor selecciona las fechas de entrada y salida en el calendario'
            });
            return;
        }

        if (!this.canReserve()) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos incompletos',
                text: 'Por favor verifica que todos los datos sean correctos'
            });
            return;
        }

        const bookingRequest: BookingRequest = {
            accommodationId: this.accommodationId,
            checkIn: this.selectedCheckIn!,
            checkOut: this.selectedCheckOut!,
            numberOfGuests: parseInt(this.reservationForm.get('guests')?.value || '1')
        };

        Swal.fire({
            title: 'Procesando reserva...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        this.bookingService.createBooking(bookingRequest).subscribe({
            next: (booking) => {
                Swal.close();
                console.log('Reserva creada:', booking);
                // Navegar a la confirmación de reserva con el ID
                this.router.navigate(['/reservations-confirm', booking.id]);
            },
            error: (error) => {
                Swal.close();
                console.error('Error al crear reserva:', error);
                const errorMessage = error.error?.message || 'No se pudo completar la reserva';
                Swal.fire('Error', errorMessage, 'error');
            }
        });
    }

    /** ---------------- COMENTARIOS Y RESEÑAS ---------------- */
    openReviewForm(): void {
        if (!this.isLoggedIn) {
            Swal.fire({
                icon: 'info',
                title: 'Inicia sesión',
                text: 'Debes iniciar sesión para dejar una reseña'
            });
            return;
        }
        this.showReviewForm = true;
    }

    closeReviewForm(): void {
        this.showReviewForm = false;
        this.reviewForm.reset();
        this.reviewRating = 0;
    }

    setReviewRating(rating: number): void {
        this.reviewRating = rating;
        this.reviewForm.patchValue({ rating });
    }

    getRatingText(rating: number): string {
        const texts: { [key: number]: string } = {
            1: 'Malo',
            2: 'Regular',
            3: 'Bueno',
            4: 'Muy Bueno',
            5: 'Excelente'
        };
        return texts[rating] || '';
    }

    onSubmitReview(): void {
        if (this.reviewForm.invalid) {
            this.markReviewFormTouched();
            return;
        }

        this.isSubmittingReview = true;

        const reviewRequest = {
            bookingId: 0, // Necesitarías obtener el bookingId del usuario
            rating: this.reviewForm.value.rating,
            comment: this.reviewForm.value.comment,
            accommodationId: this.accommodationId
        };

        this.commentService.createReview(reviewRequest).subscribe({
            next: (response: any) => {
                this.isSubmittingReview = false;
                this.closeReviewForm();
                this.loadPropertyReviews(); // Recargar las reseñas

                Swal.fire({
                    icon: 'success',
                    title: '¡Reseña enviada!',
                    text: 'Tu reseña ha sido publicada correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (error: any) => {
                this.isSubmittingReview = false;
                console.error('Error al enviar reseña:', error);
                const errorMessage = error.error?.message || 'No se pudo enviar la reseña';
                Swal.fire('Error', errorMessage, 'error');
            }
        });
    }

    private markReviewFormTouched(): void {
        Object.keys(this.reviewForm.controls).forEach(key => {
            this.reviewForm.get(key)?.markAsTouched();
        });
    }

    getStars(rating: number): number[] {
        return Array(rating).fill(0);
    }

    getEmptyStars(rating: number): number[] {
        return Array(5 - rating).fill(0);
    }

    formatReviewDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    canUserReview(): boolean {
        // Aquí podrías verificar si el usuario tiene reservas completadas en este alojamiento
        return this.isLoggedIn;
    }

    /** ---------------- DROPDOWN & AUTH ---------------- */
    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    /** ---------------- GALERÍA DE IMÁGENES ---------------- */
    openImageModal(index: number): void {
        this.currentImageIndex = index;
        this.showImageModal = true;
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    closeImageModal(): void {
        this.showImageModal = false;
        document.body.style.overflow = 'auto';
    }

    previousImage(): void {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else {
            this.currentImageIndex = this.allImages.length - 1;
        }
    }

    nextImage(): void {
        if (this.currentImageIndex < this.allImages.length - 1) {
            this.currentImageIndex++;
        } else {
            this.currentImageIndex = 0;
        }
    }

    getThumbnailImages(): string[] {
        // Retorna hasta 4 imágenes para mostrar en la galería
        return this.allImages.slice(0, 5);
    }

    hasMoreImages(): boolean {
        return this.allImages.length > 5;
    }

    getRemainingImagesCount(): number {
        return Math.max(0, this.allImages.length - 5);
    }
}