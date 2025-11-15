import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDTO } from '../models/response-dto.interface';
import { tap } from 'rxjs/operators';
import { CreateAccommodationDTO } from '../models/create-accommodation-dto.interface';
import { UpdateAccommodationDTO } from '../models/update-accommodation-dto.interface';
import { SearchAccommodationDTO } from '../models/search-accommodation-dto.interface';



@Injectable({
    providedIn: 'root'
})
export class AccommodationService {

    private accommodationURL = "https://land-bnb-production.up.railway.app/accommodations";
    private apiUrl = "https://land-bnb-production.up.railway.app/api/accommodations";

    constructor(private http: HttpClient) { }

    /**
     * (Punto 1) Get All Accommodations (Public) - CON IMÁGENES
     * Usa el endpoint de búsqueda para obtener AccommodationDetailDto con imágenes
     */
    public getAll(page: number): Observable<any> {
        const params = new HttpParams().set('page', page.toString());
        console.log('🔄 [SERVICE] Solicitando alojamientos CON imágenes...');

        // Envía una búsqueda vacía para obtener todos los alojamientos
        const emptySearch: SearchAccommodationDTO = {};

        return this.http.post<any>(`${this.accommodationURL}/search`, emptySearch, { params }).pipe(
            tap(response => {
                console.log('[SERVICE] Respuesta con imágenes:', response);
                if (response.content && response.content.length > 0) {
                    console.log(' Primera propiedad con imágenes:', {
                        title: response.content[0].title,
                        mainImage: response.content[0].mainImage,
                        images: response.content[0].images
                    });
                }
            })
        );
    }

    /**
     * (Punto 2) Get Accommodation by ID (Public)
     * Devuelve: AccommodationDetailDto
     */
    public getById(id: number): Observable<any> {
        return this.http.get<any>(`${this.accommodationURL}/${id}`);
    }

    /**
     * (Punto 3) Create Accommodation (Host Only)
     * Devuelve: InfoDto
     */
    public create(dto: CreateAccommodationDTO): Observable<any> {
        return this.http.post<any>(this.accommodationURL, dto);
    }

    /**
     * (Punto 4) Update Accommodation (HOST only)
     * Devuelve: AccommodationDetailDto
     */
    public update(id: number, dto: UpdateAccommodationDTO): Observable<any> {
        return this.http.put<any>(`${this.accommodationURL}/${id}`, dto);
    }

    /**
     * (Punto 5) Delete Accommodation (HOST only)
     * Devuelve: String
     */
    public delete(id: number): Observable<any> {
        return this.http.delete(`${this.accommodationURL}/${id}`, { responseType: 'text' });
    }

    /**
     * (Puntos 6-9) Search Accommodations (Public)
     * Devuelve: Page<AccommodationDetailDto>
     */
    public search(page: number, dto: SearchAccommodationDTO): Observable<any> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.post<any>(`${this.accommodationURL}/search`, dto, { params });
    }

    /**
     * (Punto 10) Get My Accommodations (HOST only)
     * Devuelve: Page<AccommodationDetailDto>
     */
    public getMyAccommodations(page: number): Observable<any> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<any>(`${this.accommodationURL}/host/my-accommodations`, { params });
    }

    /**
     * (Punto 11) Get Accommodations Metrics (HOST only)
     * Devuelve: AccommodationMetrics
     */
    public getMetrics(
        accommodationId: number,
        startDate: string,
        endDate: string
    ): Observable<any> {
        let params = new HttpParams();
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }

        // (Usamos apiUrl como en tu fragmento)
        return this.http.get<any>(
            `${this.apiUrl}/${accommodationId}/metrics`,
            { params }
        );
    }

    /**
     * (Punto 12) get dates unavailable
     * Devuelve: List<BookingDatesDto>
     */
    public getUnavailableDates(id: number): Observable<any> {
        return this.http.get<any>(`${this.accommodationURL}/dates-unavailable/${id}`);
    }

    /**
     * (Favoritos) Get Favorite Accommodations
     * Devuelve: Page<AccommodationDto>
     */
    public getFavoriteAccommodations(page: number): Observable<any> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<any>(`${this.accommodationURL}/favorites`, { params });
    }

    /**
     * (Favoritos) Check if Accommodation is Favorite
     * Devuelve: boolean
     */
    public isFavorite(accommodationId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.accommodationURL}/is-favorite/${accommodationId}`);
    }

    /**
     * (Favoritos) Add Favorite Accommodation
     * Devuelve: InfoDto (que coincide con ResponseDTO<String> o similar)
     */
    public addFavorite(accommodationId: number): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.accommodationURL}/add-favorite/${accommodationId}`, {});
    }

    /**
     * (Favoritos) Remove Favorite Accommodation
     * Devuelve: InfoDto
     */
    public removeFavorite(accommodationId: number): Observable<ResponseDTO> {
        return this.http.delete<ResponseDTO>(`${this.accommodationURL}/remove-favorite/${accommodationId}`);
    }

    /**
     * (Punto 14) how much user mark an accommodation as favorite
     * Devuelve: int (number)
     */
    public getUsersWhoFavoritedAccommodation(accommodationId: number): Observable<number> {
        return this.http.get<number>(`${this.accommodationURL}/host/accommodation-favorites/${accommodationId}`);
    }

    /**
     * (Nuevo) Obtiene un alojamiento específico para el host (HOST only)
     * Devuelve: ResponseDTO<AccommodationDetailDto>
     */
    public getHostAccommodation(id: number): Observable<ResponseDTO> {
        return this.http.get<ResponseDTO>(`${this.accommodationURL}/host/${id}`);
    }

}