/**
 * Interfaz para las métricas de un alojamiento
 */
export interface AccommodationMetricsDTO {
    accommodationId: number;
    accommodationName: string;
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    occupancyRate: number;
    totalGuests: number;
    averageRating: number;
    totalReviews: number;
}