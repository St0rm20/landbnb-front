import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Interface adaptada para el Anfitrión
interface Reservation {
    id: number;
    title: string; // Nombre de la propiedad
    image: string;
    checkIn: string;
    checkOut: string;
    status: string;
    guestName: string; // 👈 AÑADIDO: Nombre del huésped
    propertyId: number;
}

@Component({
    selector: 'app-reservations-host', // 👈 Nombre nuevo
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './reservations-host.component.html',
    styleUrls: ['./reservations-host.component.css']
})
export class ReservationsHostComponent implements OnInit { // 👈 Nombre nuevo
    dropdownOpen = false;
    activeTab: 'activas' | 'pasadas' | 'canceladas' = 'activas';

    // Reservas activas (Próximas)
    activeReservations: Reservation[] = [
        {
            id: 1,
            title: 'Apartamento en el centro',
            image: 'assets/imagenes/Hostal1.jpg.webp',
            checkIn: '10/10/2025',
            checkOut: '15/10/2025',
            status: 'Confirmada',
            guestName: 'Ana María López', // 👈 Dato nuevo
            propertyId: 1
        },
        {
            id: 2,
            title: 'Casa de playa',
            image: 'assets/imagenes/hostal2.jpg.avif',
            checkIn: '20/12/2025',
            checkOut: '27/12/2025',
            status: 'Confirmada',
            guestName: 'David Gómez', // 👈 Dato nuevo
            propertyId: 2
        }
    ];

    // Reservas pasadas (Completadas)
    pastReservations: Reservation[] = [
        {
            id: 3,
            title: 'Cabaña en la montaña',
            image: 'assets/imagenes/hostal3.jpg',
            checkIn: '01/05/2025',
            checkOut: '05/05/2025',
            status: 'Completada',
            guestName: 'Laura Pérez', // 👈 Dato nuevo
            propertyId: 3
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
            guestName: 'Juan Morales', // 👈 Dato nuevo
            propertyId: 5
        }
    ];

    ngOnInit(): void {
        console.log('📋 Componente de reservas de anfitrión cargado');
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
    }

    // 👈 Acción de anfitrión
    contactGuest(reservation: Reservation): void {
        alert(`Contactando a ${reservation.guestName} para la reserva ${reservation.title}...`);
    }

    // 👈 Acción de anfitrión
    viewReview(reservation: Reservation): void {
        alert(`Viendo comentario de ${reservation.guestName} para ${reservation.title}...`);
    }
}