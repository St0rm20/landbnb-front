import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ResponseDTO } from '../models/response-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class AccommodationServicesService {

    // (No necesitamos HttpClient por ahora)
    constructor() { }

    /**
     * (Paso 22 - Simulado)
     * Devuelve una lista quemada de servicios.
     */
    public getAll(): Observable<ResponseDTO> {

        // Esta es la lista de tu backend (de 'accommodation.http')
        const hardcodedServices = [
            "WiFi",
            "Air Conditioning",
            "Kitchen",
            "Pool",
            "Parking",
            "Pets" // (Añadí los de tu home.component)
        ];

        // 'of()' es una función de RxJS que crea un Observable
        // que emite un valor (nuestra respuesta simulada) inmediatamente.
        const response: ResponseDTO = {
            error: false,
            content: hardcodedServices
        };

        return of(response);
    }
}