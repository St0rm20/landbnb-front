import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewRequest {
    bookingId: number;
    rating: number;
    text: string;
}


export interface CommentDTO {
    id: number;
    calificacion: number;
    texto: string;
    respuestaAnfitrion?: string;
    fechaCreacion: string;
    usuario: {
        id: number;
        name: string;
        email: string;
        photoProfile?: string;
    };
}

export interface CommentResponse {
    content: CommentDTO[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private apiUrl = 'https://land-bnb-production.up.railway.app/api/comments';

    constructor(private http: HttpClient) { }


    /** Verifica si el usuario puede comentar un alojamiento */
    canUserComment(accommodationId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/can-comment/${accommodationId}`);
    }

    /** Verifica si el usuario HOST puede responder un comentario */
    canUserReply(commentId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/can-reply/${commentId}`);
    }

    createReview(reviewRequest: ReviewRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}`, reviewRequest);
    }

    getAccommodationComments(accommodationId: number, page: number = 0, size: number = 10): Observable<CommentResponse> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<CommentResponse>(`${this.apiUrl}/accommodation/${accommodationId}`, { params });
    }

    getCommentByBooking(bookingId: number): Observable<CommentDTO> {
        return this.http.get<CommentDTO>(`${this.apiUrl}/booking/${bookingId}`);
    }

    replyToComment(commentId: number, message: string): Observable<CommentDTO> {
        console.log("🔄 [SERVICE] Enviando respuesta al comentario:", { commentId, message });
        return this.http.post<CommentDTO>(`${this.apiUrl}/reply`, {
            commentId: commentId,
            message: message
        });
    }

    deleteComment(commentId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/delete/${commentId}`);
    }

    deleteReply(commentId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/host/delete/${commentId}`);
    }
}
