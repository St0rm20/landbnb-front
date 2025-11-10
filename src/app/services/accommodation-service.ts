import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// DTOs
import { ResponseDTO } from '../models/response-dto.interface';
import { CreateAccommodationDTO } from '../models/create-accommodation-dto.interface';
import { UpdateAccommodationDTO } from '../models/update-accommodation-dto.interface';
import { SearchAccommodationDTO } from '../models/search-accommodation-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class AccommodationService {

    private accommodationURL = "http://localhost:8080/api/accommodations";

    constructor(private http: HttpClient) { }

    /**
     * (Punto 1) Get All Accommodations (Public)
     */
    public getAll(page: number): Observable<ResponseDTO> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<ResponseDTO>(this.accommodationURL, { params });
    }

    /**
     * (Punto 2) Get Accommodation by ID (Public)
     */
    public getById(id: number): Observable<ResponseDTO> {
        return this.http.get<ResponseDTO>(`${this.accommodationURL}/${id}`);
    }

    /**
     * (Punto 3) Create Accommodation (Host Only)
     */
    public create(dto: CreateAccommodationDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(this.accommodationURL, dto);
    }

    /**
     * (Punto 4) Update Accommodation (HOST only)
     */
    public update(id: number, dto: UpdateAccommodationDTO): Observable<ResponseDTO> {
        return this.http.put<ResponseDTO>(`${this.accommodationURL}/${id}`, dto);
    }

    /**
     * (Punto 5) Delete Accommodation (HOST only)
     */
    public delete(id: number): Observable<ResponseDTO> {
        return this.http.delete<ResponseDTO>(`${this.accommodationURL}/${id}`);
    }

    /**
     * (Puntos 6, 7, 8, 9) Search Accommodations (Public)
     * Este POST envía el DTO en el body y la página como param.
     */
    public search(page: number, dto: SearchAccommodationDTO): Observable<ResponseDTO> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.post<ResponseDTO>(`${this.accommodationURL}/search`, dto, { params });
    }

    /**
     * (Punto 10) Get My Accommodations (HOST only)
     */
    public getMyAccommodations(page: number): Observable<ResponseDTO> {
        const params = new HttpParams().set('page', page.toString());
        return this.http.get<ResponseDTO>(`${this.accommodationURL}/host/my-accommodations`, { params });
    }

    /**
     * (Punto 11) Get Accommodations Metrics (HOST only)
     */
    public getMetrics(id: number, startDate: string, endDate: string): Observable<ResponseDTO> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<ResponseDTO>(`${this.accommodationURL}/${id}/metrics`, { params });
    }
}