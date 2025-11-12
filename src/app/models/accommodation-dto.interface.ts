export interface AccommodationDTO {
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


    mainImage: string;
    images: string[];
    averageRating: number;
    totalBookings: number;
}