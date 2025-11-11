export interface AccommodationDTO {
    id: number;
    title: string;
    description: string;
    city: string;
    address: string;
    pricePerNight: number;
    maxCapacity: number;
    services: string[];
    mainImage: string;
    images: string[];
    rating: number;
}