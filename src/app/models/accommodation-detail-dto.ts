import {UserInfoDTO} from "./user-info-dto";

/**
 * Interfaz para los detalles de un alojamiento (DTO)
 */
export interface AccommodationDetailDTO {
    id: number;
    title: string;
    description: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    maxCapacity: number;
    services: string[];
    host: UserInfoDTO;
    averageRating: number;
    totalBookings: number;
    mainImage: string;
    images: string[];
}