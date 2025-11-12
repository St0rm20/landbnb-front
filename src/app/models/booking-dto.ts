import {AccommodationDetailDTO} from "./accommodation-detail-dto";
import {UserInfoDTO} from "./user-info-dto";

/**
 * Interfaz para los datos de una reserva (DTO principal)
 */
export interface BookingDTO {
    id: number;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    totalPrice: number;
    status: string;
    accommodation: AccommodationDetailDTO;
    user: UserInfoDTO;
}