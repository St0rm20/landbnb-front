import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// import { ReservationService } from '../services/reservation.service'; // Descomenta cuando tengas tu servicio

interface Accommodation {
    id: string;
    name: string;
    location: string;
    image: string;
    rating: number;
    reviewCount: number;
}

interface TripDetails {
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
}

interface PriceDetails {
    pricePerNight: number;
    nights: number;
    subtotal: number;
    serviceFee: number;
    total: number;
}

interface Host {
    name: string;
    image: string;
}

interface PaymentMethod {
    type: string;
    lastDigits: string;
}

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

    accommodation: Accommodation = {
        id: '1',
        name: 'Cabaña en la Montaña',
        location: 'Salento, Quindío',
        image: 'assets/imagenes/hostal1.jpg.webp',
        rating: 4.85,
        reviewCount: 25
    };

    host: Host = {
        name: 'Carlos Flórez',
        image: 'assets/imagenes/perfil.png'
    };

    tripDetails: TripDetails = {
        checkIn: '30 ago, 2025',
        checkOut: '4 sep, 2025',
        guests: 2,
        nights: 5
    };

    priceDetails: PriceDetails = {
        pricePerNight: 150000,
        nights: 5,
        subtotal: 750000,
        serviceFee: 50000,
        total: 800000
    };

    paymentMethod: PaymentMethod = {
        type: 'Visa',
        lastDigits: '1234'
    };

    cancellationDate = '30 de agosto de 2025 a las 3:00 PM';
    checkInTime = 'Después de las 3:00 PM';
    checkOutTime = 'Antes de las 11:00 AM';

    isProcessing = false;

    constructor(
        private router: Router
        // private reservationService: ReservationService
    ) { }

    ngOnInit(): void {
        // Aquí podrías cargar los datos de la reserva desde el servicio
        // this.loadReservationData();
    }

    /**
     * Navega de vuelta al detalle del alojamiento
     */
    goBack(): void {
        this.router.navigate(['/detalle-alojamiento']);
    }

    /**
     * Navega al perfil del usuario
     */
    goToProfile(): void {
        this.router.navigate(['/perfil']);
    }

    /**
     * Abre el modal para cambiar el método de pago
     */
    changePaymentMethod(): void {
        console.log('Cambiar método de pago');
        // Aquí podrías abrir un modal o navegar a una página de métodos de pago
    }

    /**
     * Formatea números como moneda colombiana
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Confirma y procesa el pago de la reserva
     */
    confirmAndPay(): void {
        if (this.isProcessing) return;

        this.isProcessing = true;

        console.log('Procesando pago...', {
            accommodationId: this.accommodation.id,
            tripDetails: this.tripDetails,
            priceDetails: this.priceDetails,
            paymentMethod: this.paymentMethod
        });

        // Simulación de llamada a API
        setTimeout(() => {
            this.isProcessing = false;
            alert('¡Reserva confirmada exitosamente!');
            this.router.navigate(['/mis-reservas']);

            // Para simular un error, descomenta:
            // alert('Error al procesar el pago. Por favor, intenta nuevamente.');
        }, 2000);

        /* Cuando conectes con tu backend, reemplaza el setTimeout por:
        this.reservationService.confirmReservation({
          accommodationId: this.accommodation.id,
          tripDetails: this.tripDetails,
          paymentMethod: this.paymentMethod
        }).subscribe({
          next: (response) => {
            this.isProcessing = false;
            alert('¡Reserva confirmada exitosamente!');
            this.router.navigate(['/mis-reservas']);
          },
          error: (error) => {
            this.isProcessing = false;
            alert('Error al procesar el pago. Por favor, intenta nuevamente.');
          }
        });
        */
    }
}