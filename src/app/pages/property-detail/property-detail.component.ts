import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface Property {
    id: number;
    title: string;
    location: string;
    price: number;
    rating: number;
    description: string;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
}

interface Review {
    user: string;
    date: string;
    comment: string;
    avatar: string;
}

@Component({
    selector: 'app-property-detail',
    templateUrl: './property-detail.component.html',
    styleUrls: ['./property-detail.component.css'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class PropertyDetailComponent implements OnInit {
    reservationForm: FormGroup;
    dropdownOpen = false;

    property: Property = {
        id: 1,
        title: 'Laureles - Apartaestudio Iluminado',
        location: 'Medellín, Colombia',
        price: 180000,
        rating: 4.85,
        description: 'Este es un lugar acogedor, perfecto para familias o grupos de amigos. Cuenta con todas las comodidades que necesitas para una estadía inolvidable. Ubicado en el corazón de Laureles, tendrás acceso a los mejores restaurantes y parques de la ciudad a solo unos pasos.',
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1,
        amenities: ['wifi', 'kitchen', 'ac', 'parking']
    };

    reviews: Review[] = [
        { user: 'Usuario A', date: 'Agosto 2025', comment: '¡Excelente lugar!', avatar: 'assets/imagenes/perfil.png' },
        { user: 'Usuario B', date: 'Julio 2025', comment: 'El alojamiento es bueno.', avatar: 'assets/imagenes/perfil.png' }
    ];

    serviceFee = 65000;
    nights = 1; // noches iniciales

    // Fechas
    minDate: string = '';
    minCheckoutDate: string = '';
    dateError: string = '';

    constructor(private fb: FormBuilder, private route: ActivatedRoute) {
        this.reservationForm = this.fb.group({
            checkIn: ['', Validators.required],
            checkOut: ['', Validators.required],
            guests: ['1', Validators.required]
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const propertyId = params['id'];
            console.log('Cargando propiedad:', propertyId);
        });

        this.initializeDates();
    }

    /** ---------------- Fechas ---------------- */
    initializeDates(): void {
        const today = new Date();
        this.minDate = this.formatDate(today);
        this.reservationForm.get('checkIn')?.setValue(this.minDate);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.reservationForm.get('checkOut')?.setValue(this.formatDate(tomorrow));

        this.updateMinCheckoutDate();
        this.dateError = '';
        this.updateNights();
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }

    onDateChange(): void {
        this.validateDates();
        this.updateNights();
    }

    validateDates(): void {
        this.dateError = '';
        const checkIn = new Date(this.reservationForm.get('checkIn')?.value || '');
        const checkOut = new Date(this.reservationForm.get('checkOut')?.value || '');

        if (checkOut < checkIn) {
            this.dateError = 'La fecha de salida no puede ser anterior a la fecha de entrada';
            return;
        }

        if (checkIn.getTime() === checkOut.getTime()) {
            this.dateError = 'La estadía debe ser de al menos una noche';
            return;
        }

        this.updateMinCheckoutDate();
    }

    updateMinCheckoutDate(): void {
        const checkInValue = this.reservationForm.get('checkIn')?.value;
        if (checkInValue) {
            const checkIn = new Date(checkInValue);
            const minCheckout = new Date(checkIn);
            minCheckout.setDate(minCheckout.getDate() + 1);
            this.minCheckoutDate = this.formatDate(minCheckout);

            const checkOutValue = this.reservationForm.get('checkOut')?.value;
            if (checkOutValue && new Date(checkOutValue) <= checkIn) {
                this.reservationForm.get('checkOut')?.setValue(this.minCheckoutDate);
            }
        }
    }

    updateNights(): void {
        const checkIn = new Date(this.reservationForm.get('checkIn')?.value || '');
        const checkOut = new Date(this.reservationForm.get('checkOut')?.value || '');
        const diff = checkOut.getTime() - checkIn.getTime();
        this.nights = Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
    }

    /** ---------------- Reservas ---------------- */
    calculateSubtotal(): number {
        return this.property.price * this.nights;
    }

    calculateTotal(): number {
        return this.calculateSubtotal() + this.serviceFee;
    }

    onReserve() {
        if (this.reservationForm.valid && !this.dateError) {
            console.log('Reservando:', this.reservationForm.value);
            alert('¡Reserva realizada con éxito!');
        } else {
            alert(this.dateError || 'Por favor completa todos los campos requeridos.');
        }
    }

    /** ---------------- Dropdown ---------------- */
    toggleDropdown(event: Event): void {
        event.preventDefault();
        this.dropdownOpen = !this.dropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    openImageModal(imageUrl: string) {
        console.log('Abriendo imagen:', imageUrl);
    }
}
