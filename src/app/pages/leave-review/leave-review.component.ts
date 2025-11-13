import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommentService, ReviewRequest } from '../../services/comment-service';
import { TokenService } from '../../services/token-service.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-leave-review',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './leave-review.component.html',
    styleUrls: ['./leave-review.component.css']
})
export class LeaveReviewComponent implements OnInit {
    rating = 0;
    hoverRating = 0;
    comment = '';
    dropdownOpen = false;
    isSubmitting = false;

    accommodationId: number = 0;
    bookingId?: number;

    // Información del alojamiento (esto vendría de un servicio o parámetro de ruta)
    accommodation = {
        name: 'Cabaña en la Montaña',
        image: 'assets/imagenes/hostal3.jpg',
        checkIn: '01 mayo',
        checkOut: '05 mayo, 2025'
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private commentService: CommentService,
        private tokenService: TokenService
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.accommodationId = idParam ? +idParam : 0;

        // También podrías obtener el bookingId de los parámetros de consulta
        const bookingParam = this.route.snapshot.queryParamMap.get('bookingId');
        this.bookingId = bookingParam ? +bookingParam : undefined;

        console.log('Accommodation id:', this.accommodationId);
        console.log('Booking id:', this.bookingId);

        // Aquí deberías cargar la información real del alojamiento desde un servicio
        this.loadAccommodationData();
    }

    loadAccommodationData(): void {
        // Implementar la carga de datos reales del alojamiento
        // this.accommodationService.getById(this.accommodationId).subscribe(...)
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
        if (this.rating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Calificación requerida',
                text: 'Por favor selecciona una calificación con las estrellas.'
            });
            return;
        }

        if (!this.comment.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Comentario requerido',
                text: 'Por favor escribe un comentario sobre tu experiencia.'
            });
            return;
        }

        if (this.comment.trim().length < 10) {
            Swal.fire({
                icon: 'warning',
                title: 'Comentario muy corto',
                text: 'El comentario debe tener al menos 10 caracteres.'
            });
            return;
        }

        if (!this.accommodationId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo identificar el alojamiento.'
            });
            return;
        }

        this.isSubmitting = true;

        const reviewRequest: ReviewRequest = {
            bookingId: this.bookingId || 0, // Si no hay bookingId, usar 0 (ajustar según tu backend)
            rating: this.rating,
            comment: this.comment.trim(),
            accommodationId: this.accommodationId
        };

        console.log('Enviando reseña:', reviewRequest);

        this.commentService.createReview(reviewRequest).subscribe({
            next: (response: any) => {
                this.isSubmitting = false;
                console.log('Reseña enviada exitosamente:', response);

                Swal.fire({
                    icon: 'success',
                    title: '¡Gracias por tu opinión!',
                    text: 'Tu comentario ha sido enviado correctamente.',
                    timer: 3000,
                    showConfirmButton: false
                }).then(() => {
                    // Redirigir a la página de historial de reservas o al home
                    this.router.navigate(['/reservations-history']);
                });
            },
            error: (error: any) => {
                this.isSubmitting = false;
                console.error('Error al enviar reseña:', error);

                const errorMessage = error.error?.message || 'No se pudo enviar tu reseña. Intenta nuevamente.';
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage
                });
            }
        });
    }

    // Método alternativo si quieres usar navegación en lugar de SweetAlert
    onSubmitAlternative(): void {
        if (this.rating === 0 || !this.comment.trim() || this.comment.trim().length < 10) {
            alert('Por favor completa todos los campos correctamente.');
            return;
        }

        const review = {
            accommodationId: this.accommodationId,
            rating: this.rating,
            comment: this.comment.trim(),
            date: new Date().toISOString()
        };

        console.log('Comentario enviado:', review);
        alert('¡Gracias por tu opinión!\n\nTu comentario ha sido enviado correctamente.');

        // Resetear formulario
        this.rating = 0;
        this.comment = '';
        this.hoverRating = 0;

        // Redirigir
        this.router.navigate(['/reservations-history']);
    }
}