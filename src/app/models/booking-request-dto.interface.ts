/**
 * Interfaz para la solicitud de creación de una reserva (request)
 */
export interface BookingRequestDTO {
    accommodationId: number;
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
}