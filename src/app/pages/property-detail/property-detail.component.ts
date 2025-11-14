import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MapService } from '../../services/map-service';
import { AccommodationService } from '../../services/accommodation-service.service';
import { BookingService, BookingRequest } from '../../services/booking.service';
import { TokenService } from '../../services/token-service.service';
import { UserService } from '../../services/user-service.service';
import { CommentService, CommentDTO } from '../../services/comment-service';
import { AccommodationDetailDTO } from '../../models/accommodation-detail-dto';
import { UserDto } from '../../models/user-dto.interface';
import Swal from 'sweetalert2';

interface UnavailableDate {
    checkInDate: string;
    checkOutDate: string;
}

interface ReviewWithReply {
    review: CommentDTO;
    canReply: boolean;
    showReplyForm: boolean;
    replyText: string;
    isSubmittingReply: boolean;
    userPhotoUrl?: string;
}

@Component({
    selector: 'app-property-detail',
    templateUrl: './property-detail.component.html',
    styleUrls: ['./property-detail.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
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

    // Propiedades del Navbar (actualizadas)
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    reviewsWithReplies: ReviewWithReply[] = [];
    showReviewForm: boolean = false;
    isSubmittingReview: boolean = false;
    reviewRating: number = 0;
    canUserLeaveReview: boolean = false;
    isCheckingReviewPermission: boolean = false;

    serviceFee = 65000;
    nights = 0;

    minDate: string = '';

    // Galería de imágenes
    showImageModal: boolean = false;
    currentImageIndex: number = 0;
    allImages: string[] = [];

    // Cache de fotos de perfil
    userPhotosCache: { [userId: number]: string } = {};
    hostPhotoUrl: string = '';

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private mapService: MapService,
        private accommodationService: AccommodationService,
        private bookingService: BookingService,
        private tokenService: TokenService,
        private userService: UserService,
        private commentService: CommentService,
        private sanitizer: DomSanitizer
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
        this.checkAuthentication();

        this.route.params.subscribe(params => {
            this.accommodationId = +params['id'];
            if (this.accommodationId) {
                this.loadAccommodationDetails();
                this.loadUnavailableDates();
                this.loadPropertyReviews();
                if (this.isLoggedIn) {
                    this.checkIfFavorite();
                    this.checkCanUserReview();
                }
            }
        });

        this.initializeDates();
        this.generateCalendar();
    }

    ngAfterViewInit(): void {
        // El mapa se inicializará después de cargar los detalles
    }

    // Getters para verificar roles (consistentes con Home)
    get isHost(): boolean {
        return this.userRole === 'HOST';
    }

    get isUser(): boolean {
        return this.userRole === 'USER';
    }

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
        imgElement.onerror = null; // Prevenir bucles infinitos
    }

    // CORRECCIÓN COMPLETA: property-detail.component.ts

// 1. Agregar este método después del método fixCloudinaryUrl:

    private processAccommodationData(accommodation: any): AccommodationDetailDTO {
        console.log('--- PROCESANDO ACCOMMODATION DETAIL ---');
        console.log('ID:', accommodation.id);
        console.log('mainImage ANTES:', accommodation.mainImage);
        console.log('images ANTES:', accommodation.images);

        let mainImageUrl = accommodation.mainImage;
        let allImages: string[] = accommodation.images || [];

        // Procesar imagen principal
        if (mainImageUrl) {
            console.log('Procesando mainImage...');
            mainImageUrl = this.fixCloudinaryUrl(mainImageUrl);
            console.log('mainImage DESPUÉS de fixCloudinaryUrl:', mainImageUrl);
        } else {
            console.log('No hay mainImage, buscando en images array...');
            mainImageUrl = allImages.length > 0
                ? this.fixCloudinaryUrl(allImages[0])
                : '';
            console.log('mainImage asignada desde array:', mainImageUrl);
        }

        // Procesar todas las imágenes y filtrar URLs vacías
        allImages = allImages
            .map(img => {
                const fixed = this.fixCloudinaryUrl(img);
                console.log(`Imagen array: ${img} -> ${fixed}`);
                return fixed;
            })
            .filter(img => {
                const isValid = img && img.trim() !== '';
                console.log(`Validando imagen: ${img} -> ${isValid ? 'válida' : 'inválida'}`);
                return isValid;
            });

        console.log('mainImage FINAL:', mainImageUrl);
        console.log('images FINAL:', allImages);
        console.log('--- FIN PROCESAMIENTO ---\n');

        // Retornar el objeto procesado con todas las propiedades
        return {
            ...accommodation,
            mainImage: mainImageUrl,
            images: allImages
        } as AccommodationDetailDTO;
    }

    loadAccommodationDetails(): void {
        this.accommodationService.getById(this.accommodationId).subscribe({
            next: (data: AccommodationDetailDTO) => {

                this.property = this.processAccommodationData(data);
                console.log('Alojamiento cargado y procesado:', this.property);


                this.allImages = [];
                if (this.property.mainImage) {
                    this.allImages.push(this.property.mainImage);
                }
                if (this.property.images && this.property.images.length > 0) {
                    // Filtrar la imagen principal de las adicionales
                    const additionalImages = this.property.images.filter(img => img !== this.property?.mainImage);
                    this.allImages.push(...additionalImages);
                }

                console.log('allImages FINAL:', this.allImages);

                // Guardar foto del host
                if (this.property.host?.photoProfile) {
                    this.hostPhotoUrl = this.fixCloudinaryUrl(this.property.host.photoProfile);
                }

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

    checkCanUserReview(): void {
        this.isCheckingReviewPermission = true;
        console.log('Verificando permisos para comentar en alojamiento:', this.accommodationId);

        this.commentService.canUserComment(this.accommodationId).subscribe({
            next: (canComment: boolean) => {
                this.canUserLeaveReview = canComment;
                this.isCheckingReviewPermission = false;
                console.log('Puede comentar:', canComment);
                console.log('Estado actual - isLoggedIn:', this.isLoggedIn, 'userRole:', this.userRole, 'canUserLeaveReview:', this.canUserLeaveReview);
            },
            error: (error) => {
                console.error('Error al verificar permisos de reseña:', error);
                this.canUserLeaveReview = false;
                this.isCheckingReviewPermission = false;
            }
        });
    }

    loadPropertyReviews(): void {
        this.commentService.getAccommodationComments(this.accommodationId, 0, 10).subscribe({
            next: (response) => {
                const reviews = response.content || [];
                console.log('Reseñas cargadas:', reviews);

                // Procesar cada reseña
                this.reviewsWithReplies = reviews.map(review => ({
                    review: review,
                    canReply: false,
                    showReplyForm: false,
                    replyText: '',
                    isSubmittingReply: false,
                    userPhotoUrl: undefined
                }));

                // Cargar fotos de perfil de usuarios y verificar permisos de respuesta
                this.reviewsWithReplies.forEach((item, index) => {
                    // Cargar foto del usuario
                    this.loadUserPhoto(item.review.usuario.id, index);

                    // Verificar si el usuario logueado puede responder (solo si es host)
                    if (this.isLoggedIn && this.userRole === 'HOST') {
                        this.checkCanReplyToComment(item.review.id, index);
                    }
                });
            },
            error: (error) => {
                console.error('Error al cargar reseñas:', error);
                this.reviewsWithReplies = [];
            }
        });
    }

    loadUserPhoto(userId: number, reviewIndex: number): void {
        // Verificar si ya tenemos la foto en caché
        if (this.userPhotosCache[userId]) {
            this.reviewsWithReplies[reviewIndex].userPhotoUrl = this.userPhotosCache[userId];
            return;
        }

        // Cargar del servicio (necesitarías un endpoint para obtener usuario por ID)
        // Por ahora, usar la foto que viene en el comentario si existe
        if (this.reviewsWithReplies[reviewIndex].review.usuario.photoProfile) {
            this.reviewsWithReplies[reviewIndex].userPhotoUrl =
                this.reviewsWithReplies[reviewIndex].review.usuario.photoProfile;
        }
    }

    checkCanReplyToComment(commentId: number, reviewIndex: number): void {
        console.log('Verificando permiso para responder comentario:', commentId);

        this.commentService.canUserReply(commentId).subscribe({
            next: (canReply: boolean) => {
                this.reviewsWithReplies[reviewIndex].canReply = canReply;
                console.log(`✅ Comentario ${commentId} - Puede responder:`, canReply);
            },
            error: (error) => {
                console.error(`❌ Error al verificar permisos de respuesta para comentario ${commentId}:`, error);
                this.reviewsWithReplies[reviewIndex].canReply = false;
            }
        });
    }

    toggleReplyForm(index: number): void {
        this.reviewsWithReplies[index].showReplyForm = !this.reviewsWithReplies[index].showReplyForm;
        if (!this.reviewsWithReplies[index].showReplyForm) {
            this.reviewsWithReplies[index].replyText = '';
        }
    }

    submitReply(index: number): void {
        const item = this.reviewsWithReplies[index];

        if (!item.replyText || item.replyText.trim().length < 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Respuesta muy corta',
                text: 'La respuesta debe tener al menos 10 caracteres'
            });
            return;
        }

        item.isSubmittingReply = true;

        console.log('Enviando respuesta al comentario:', item.review.id);
        console.log('Texto de respuesta:', item.replyText.trim());

        // El endpoint replyToComment ya maneja el formato correcto internamente
        this.commentService.replyToComment(item.review.id, item.replyText.trim()).subscribe({
            next: (updatedComment: CommentDTO) => {
                console.log('Respuesta enviada exitosamente:', updatedComment);
                item.isSubmittingReply = false;
                item.showReplyForm = false;
                item.replyText = '';
                // Actualizar la respuesta en el comentario actual
                item.review.respuestaAnfitrion = updatedComment.respuestaAnfitrion;

                Swal.fire({
                    icon: 'success',
                    title: '¡Respuesta enviada!',
                    text: 'Tu respuesta ha sido publicada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: (error) => {
                console.error('❌ Error al enviar respuesta:', error);
                console.error('Detalles del error:', error.error);
                item.isSubmittingReply = false;
                const errorMsg = error.error?.message || error.message || 'No se pudo enviar la respuesta';
                Swal.fire('Error', errorMsg, 'error');
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
            this.selectedCheckIn = day.dateString;
            this.selectedCheckOut = null;
        } else {
            const checkIn = new Date(this.selectedCheckIn);
            const selected = new Date(day.dateString);

            if (selected > checkIn) {
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
            1: '⭐ Malo',
            2: '⭐⭐ Regular',
            3: '⭐⭐⭐ Bueno',
            4: '⭐⭐⭐⭐ Muy Bueno',
            5: '⭐⭐⭐⭐⭐ Excelente'
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
            bookingId: 0,
            rating: this.reviewForm.value.rating,
            text: this.reviewForm.value.comment,
        };

        this.commentService.createReview(reviewRequest).subscribe({
            next: (response: any) => {
                this.isSubmittingReview = false;
                this.closeReviewForm();
                this.loadPropertyReviews();

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
        return Array(Math.min(rating, 5)).fill(0);
    }

    getEmptyStars(rating: number): number[] {
        return Array(Math.max(5 - rating, 0)).fill(0);
    }

    formatReviewDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
        if (this.allImages.length === 0) return;
        this.currentImageIndex = index;
        this.showImageModal = true;
        document.body.style.overflow = 'hidden';
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
        return this.allImages.slice(0, 5);
    }

    hasMoreImages(): boolean {
        return this.allImages.length > 5;
    }

    getRemainingImagesCount(): number {
        return Math.max(0, this.allImages.length - 5);
    }
}