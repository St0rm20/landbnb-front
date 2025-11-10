import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ResponseDTO } from '../models/response-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class CityService {

    constructor() { }

    /**
     * (Paso 23 - Simulado)
     * Devuelve una lista quemada de ciudades.
     */
    public getAll(): Observable<ResponseDTO> {

        // (Basado en tus ejemplos de .http)
        const hardcodedCities = [
            "Medallo", // (o Medellín)
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