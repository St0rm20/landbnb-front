import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-leave-review',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './leave-review.component.html',
    styleUrls: ['./leave-review.component.css']
})
export class LeaveReviewComponent {
    rating = 0;
    comment = '';

    setRating(stars: number): void {
        this.rating = stars;
    }

    onSubmit(): void {
        if (!this.comment.trim()) {
            alert('Por favor escribe un comentario.');
            return;
        }

        console.log('Comentario enviado:', {
            calificación: this.rating,
            comentario: this.comment
        });

        alert('¡Gracias por tu opinión!');
        this.rating = 0;
        this.comment = '';
    }
}
