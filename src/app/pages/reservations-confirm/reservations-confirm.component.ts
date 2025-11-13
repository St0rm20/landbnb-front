import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BookingService, BookingDto } from '../../services/booking.service';

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
    bookingData: BookingDto | null = null;

    cancellationDate = '';
    checkInTime = 'Después de las 3:00 PM';
    checkOutTime = 'Antes de las 11:00 AM';

    isProcessing = false;
    isLoading = true;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookingService: BookingService
    ) { }

    ngOnInit(): void {
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

    loadBookingData(): void {
        this.isLoading = true;

        this.bookingService.getBookingById(this.bookingId).subscribe({
            next: (booking: BookingDto) => {
                this.bookingData = booking;
                this.calculateCancellationDate(booking.checkInDate);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error al cargar la reserva:', error);
                alert('Error al cargar los datos de la reserva');
                this.isLoading = false;
                this.router.navigate(['/']);
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
            this.router.navigate(['/']);
        }
    }

    goToProfile(): void {
        this.router.navigate(['/perfil']);
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
                this.router.navigate(['/mis-reservas']);
            },
            error: (error) => {
                this.isProcessing = false;
                console.error('Error al confirmar la reserva:', error);
                alert('Error al procesar el pago. Por favor, intenta nuevamente.');
            }
        });
    }
}