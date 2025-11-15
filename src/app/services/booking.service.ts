import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private apiUrl = 'https://land-bnb-production.up.railway.app/api/booking';

    constructor(private http: HttpClient) {}

    /**
     * Crea una nueva reserva
     */
    createBooking(bookingRequest: BookingRequest): Observable<BookingDto> {
        return this.http.post<BookingDto>(this.apiUrl, bookingRequest);
    }

    /**
     * Obtiene las reservas del usuario autenticado
     * @param status Estado de la reserva (PENDING, CONFIRMED, CANCELLED, COMPLETED)
     * @param page Número de página
     * @param size Tamaño de página
     */
    getUserBookings(status?: string, page: number = 0, size: number = 10): Observable<PagedBookings> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<PagedBookings>(`${this.apiUrl}/user`, { params });
    }

    /**
     * Obtiene las reservas del host autenticado
     * @param accommodationId ID del alojamiento (opcional)
     * @param status Estado de la reserva (opcional)
     * @param page Número de página
     * @param size Tamaño de página
     */
    getHostBookings(
        accommodationId?: number,
        status?: string,
        page: number = 0,
        size: number = 10
    ): Observable<PagedBookings> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (accommodationId) {
            params = params.set('accommodationId', accommodationId.toString());
        }

        if (status) {
            params = params.set('status', status);
        }

        return this.http.get<PagedBookings>(`${this.apiUrl}/host`, { params });
    }

    /**
     * Cancela una reserva (usuario)
     */
    cancelBooking(bookingId: number): Observable<InfoDto> {
        return this.http.post<InfoDto>(`${this.apiUrl}/${bookingId}/cancel`, {});
    }

    /**
     * Cancela una reserva (host)
     */
    cancelBookingByHost(bookingId: number): Observable<InfoDto> {
        return this.http.post<InfoDto>(`${this.apiUrl}/host/${bookingId}/cancel`, {});
    }

    /**
     * Confirma/completa una reserva
     */
    confirmBooking(bookingId: number): Observable<BookingDto> {
        return this.http.post<BookingDto>(`${this.apiUrl}/${bookingId}/confirm`, {});
    }

    /**
     * Obtiene una reserva específica por su ID
     */
    getBookingById(id: number): Observable<BookingDto> {
        return this.http.get<BookingDto>(`${this.apiUrl}/${id}`);
    }
}

// ===== INTERFACES =====

export interface BookingRequest {
    accommodationId: number;
    checkIn: string; // formato: yyyy-MM-dd
    checkOut: string; // formato: yyyy-MM-dd
    numberOfGuests: number;
}

export interface BookingDto {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    totalPrice: number;
    status: string; // PENDING, CONFIRMED, CANCELLED, COMPLETED
    accommodation: AccommodationDetailDto;
    user: UserInfoDto;
}

export interface AccommodationDetailDto {
    id: number;
    title: string;
    description: string;
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    pricePerNight: number;
    maxCapacity: number;
    services?: string[];
    host: HostInfoDto;
    averageRating: number;
    totalBookings: number;
    mainImage?: string;
    images?: string[];
}

export interface HostInfoDto {
    name: string;
    lastName: string;
    photoProfile?: string;
}

export interface UserInfoDto {
    id?: number;
    name: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    photoProfile?: string;
}

export interface InfoDto {
    message: string;
    description: string;
}

export interface PagedBookings {
    content: BookingDto[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}