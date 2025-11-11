import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ResponseDTO } from '../models/response-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class CityService {

    constructor() { }

    /**
     * Devuelve una lista quemada de ciudades.
     */
    public getAll(): Observable<ResponseDTO> {


        const hardcodedCities = [
            "Medellin",
            "Bogotá",
            "Cartagena",
            "Salento",
            "Armenia"
        ];

        const response: ResponseDTO = {
            error: false,
            content: hardcodedCities
        };

        return of(response);
    }
}