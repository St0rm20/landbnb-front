import { Component, OnInit } from '@angular/core';
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
        {
            user: 'Usuario A',
            date: 'Agosto 2025',
            comment: '¡Excelente lugar! Muy limpio y la ubicación es perfecta. Lo recomiendo 100%.',
            avatar: 'assets/imagenes/perfil.png'
        },
        {
            user: 'Usuario B',
            date: 'Julio 2025',
            comment: 'El alojamiento es bueno, pero la cocina podría estar mejor equipada. El anfitrión fue muy amable.',
            avatar: 'assets/imagenes/perfil.png'
        }
    ];

    serviceFee = 65000;
    nights = 5;

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
    }

    calculateSubtotal(): number {
        return this.property.price * this.nights;
    }

    calculateTotal(): number {
        return this.calculateSubtotal() + this.serviceFee;
    }

    onReserve() {
        if (this.reservationForm.valid) {
            console.log('Reservando:', this.reservationForm.value);
            alert('¡Reserva realizada con éxito!');
        } else {
            alert('Por favor completa todos los campos requeridos.');
        }
    }

    openImageModal(imageUrl: string) {
        console.log('Abriendo imagen:', imageUrl);
    }
}