import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Reservation {
    id: number;
    title: string;
    image: string;
    checkIn: string;
    checkOut: string;
    status: string;
    propertyId: number;
}

@Component({
    selector: 'app-reservations-history',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './reservations-history.component.html',
    styleUrls: ['./reservations-history.component.css']
})
export class ReservationsHistoryComponent implements OnInit {
    dropdownOpen = false;
    activeTab: 'activas' | 'pasadas' | 'canceladas' = 'activas';

    // Reservas activas
    activeReservations: Reservation[] = [
        {
            id: 1,
            title: 'Apartamento en el centro',
            image: 'assets/imagenes/Hostal1.jpg.webp',
            checkIn: '10/10/2025',
            checkOut: '15/10/2025',
            status: 'Confirmada',
            propertyId: 1
        },
        {
            id: 2,
            title: 'Casa de playa',
            image: 'assets/imagenes/hostal2.jpg.avif',
            checkIn: '20/12/2025',
            checkOut: '27/12/2025',
            status: 'Confirmada',
            propertyId: 2
        }
    ];

    // Reservas pasadas
    pastReservations: Reservation[] = [
        {
            id: 3,
            title: 'Cabaña en la montaña',
            image: 'assets/imagenes/hostal3.jpg',
            checkIn: '01/05/2025',
            checkOut: '05/05/2025',
            status: 'Completada',
            propertyId: 3
        },
        {
            id: 4,
            title: 'Apartamento moderno',
            image: 'assets/imagenes/hostal4.jpg',
            checkIn: '15/03/2025',
            checkOut: '18/03/2025',
            status: 'Completada',
            propertyId: 4
        }
    ];

    // Reservas canceladas
    canceledReservations: Reservation[] = [
        {
            id: 5,
            title: 'Loft en la ciudad',
            image: 'assets/imagenes/hostal2.jpg.avif',
            checkIn: '20/06/2025',
            checkOut: '22/06/2025',
            status: 'Cancelada',
            propertyId: 5
        }
    ];

    ngOnInit(): void {
        console.log('📋 Componente de historial de reservas cargado');
        console.log('📊 Reservas activas:', this.activeReservations.length);
        console.log('📊 Reservas pasadas:', this.pastReservations.length);
        console.log('📊 Reservas canceladas:', this.canceledReservations.length);
    }

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

    setActiveTab(tab: 'activas' | 'pasadas' | 'canceladas'): void {
        this.activeTab = tab;
        console.log('📑 Tab activa:', tab);
    }

    cancelReservation(reservation: Reservation): void {
        const confirmed = confirm(
            `¿Estás seguro de que deseas cancelar la reserva de "${reservation.title}"?\n\n` +
            `Fechas: ${reservation.checkIn} - ${reservation.checkOut}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (confirmed) {
            console.log('Cancelando reserva:', reservation);

            // Remover de reservas activas
            const index = this.activeReservations.findIndex(r => r.id === reservation.id);
            if (index > -1) {
                this.activeReservations.splice(index, 1);
            }

            // Agregar a canceladas
            reservation.status = 'Cancelada';
            this.canceledReservations.push(reservation);

            alert('Reserva cancelada exitosamente.\n\nSe ha procesado el reembolso según los términos y condiciones.');

            // Aquí iría la llamada al backend
            // this.reservationService.cancelReservation(reservation.id).subscribe(...)
        }
    }

    getTotalReservations(): number {
        return this.activeReservations.length +
            this.pastReservations.length +
            this.canceledReservations.length;
    }
}