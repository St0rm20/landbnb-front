import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-leave-review',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './leave-review.component.html',
    styleUrls: ['./leave-review.component.css']
})
export class LeaveReviewComponent {
    rating = 0;
    hoverRating = 0;
    comment = '';
    dropdownOpen = false;

    // Información del alojamiento (esto vendría de un servicio o parámetro de ruta)
    accommodation = {
        name: 'Cabaña en la Montaña',
        image: 'assets/imagenes/hostal3.jpg',
        checkIn: '01 mayo',
        checkOut: '05 mayo, 2025'
    };

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

    setRating(stars: number): void {
        this.rating = stars;
        console.log('⭐ Calificación seleccionada:', stars);
    }

    getRatingText(): string {
        const texts: { [key: number]: string } = {
            1: '😞 Muy mala experiencia',
            2: '😕 Mala experiencia',
            3: '😐 Experiencia regular',
            4: '😊 Buena experiencia',
            5: '🤩 ¡Excelente experiencia!'
        };
        return texts[this.rating] || '';
    }

    onSubmit(): void {
        // Validar que haya calificación
        if (this.rating === 0) {
            alert('Por favor selecciona una calificación con las estrellas.');
            return;
        }

        // Validar que haya comentario
        if (!this.comment.trim()) {
            alert('Por favor escribe un comentario sobre tu experiencia.');
            return;
        }

        // Validar longitud mínima del comentario
        if (this.comment.trim().length < 10) {
            alert('El comentario debe tener al menos 10 caracteres.');
            return;
        }

        const review = {
            accommodationId: 1, // Este vendría de los parámetros de ruta
            rating: this.rating,
            comment: this.comment.trim(),
            date: new Date().toISOString()
        };

        console.log('Comentario enviado:', review);

        // Aquí iría la llamada al servicio HTTP
        // this.reviewService.createReview(review).subscribe(...)

        alert('¡Gracias por tu opinión!\n\nTu comentario ha sido enviado correctamente.');

        // Resetear el formulario
        this.rating = 0;
        this.comment = '';
        this.hoverRating = 0;
    }
}