export interface SearchAccommodationDTO {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    numberOfGuests?: number;
    minPrice?: number;
    maxPrice?: number;
    services?: string[];
}