import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface Property {
    id: number;
    title: string;
    city: string;
    price: number;
    status: 'Activo' | 'Inactivo' | 'Eliminado';
    views: number;
    rating: number;
    image?: string;
}

@Component({
    selector: 'app-host-properties',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './host-properties.component.html',
    styleUrls: ['./host-properties.component.css']
})
export class HostPropertiesComponent implements OnInit {
    dropdownOpen = false;

    properties: Property[] = [
        {
            id: 1,
            title: 'Apartamento en el centro',
            city: 'Medellín',
            price: 150000,
            status: 'Activo',
            views: 245,
            rating: 4.8,
            image: 'assets/imagenes/Hostal1.jpg.webp'
        },
        {
            id: 2,
            title: 'Cabaña en la montaña',
            city: 'Armenia',
            price: 120000,
            status: 'Eliminado',
            views: 189,
            rating: 4.9,
            image: 'assets/imagenes/hostal3.jpg'
        },
        {
            id: 3,
            title: 'Casa de playa',
            city: 'Cartagena',
            price: 200000,
            status: 'Activo',
            views: 312,
            rating: 4.7,
            image: 'assets/imagenes/hostal2.jpg.avif'
        },
        {
            id: 4,
            title: 'Loft moderno',
            city: 'Bogotá',
            price: 180000,
            status: 'Activo',
            views: 156,
            rating: 4.6,
            image: 'assets/imagenes/hostal4.jpg'
        }
    ];

    constructor(private router: Router) {}

    ngOnInit(): void {
        console.log('🏠 Componente de gestión de alojamientos cargado');
        console.log('📊 Total de alojamientos:', this.properties.length);
        console.log('✅ Alojamientos activos:', this.getActiveProperties());
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

    editProperty(property: Property): void {
        console.log('✏️ Editando propiedad:', property);

        // Aquí navegarías a la página de edición con el ID
        // this.router.navigate(['/editar-alojamiento', property.id]);

        alert(`Redirigiendo a editar:\n\n${property.title}\nID: ${property.id}`);
    }

    deleteProperty(property: Property): void {
        if (property.status === 'Eliminado') {
            alert('⚠️ Este alojamiento ya está eliminado.');
            return;
        }

        const confirmed = confirm(
            `¿Estás seguro de que deseas eliminar este alojamiento?\n\n` +
            `${property.title}\n` +
            `${property.city} - ${property.price.toLocaleString('es-CO', {style: 'currency', currency: 'COP'})}\n\n` +
            `Esta acción no se puede deshacer.`
        );

        if (confirmed) {
            console.log('🗑️ Eliminando propiedad:', property);

            // Cambiar el estado a Eliminado en lugar de eliminar del array
            property.status = 'Eliminado';

            alert(`✅ Alojamiento "${property.title}" eliminado exitosamente.`);

            // Aquí iría la llamada al backend
            // this.propertyService.deleteProperty(property.id).subscribe(...)
        }
    }

    getActiveProperties(): number {
        return this.properties.filter(p => p.status === 'Activo').length;
    }

    getTotalViews(): number {
        return this.properties.reduce((sum, p) => sum + p.views, 0);
    }

    getAverageRating(): string {
        const activeProps = this.properties.filter(p => p.status === 'Activo');
        if (activeProps.length === 0) return '0.0';

        const sum = activeProps.reduce((acc, p) => acc + p.rating, 0);
        const avg = sum / activeProps.length;
        return avg.toFixed(1);
    }
}