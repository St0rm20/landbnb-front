import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ResponseDTO } from '../models/response-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class ImageService {

    private imageUrl = "http://localhost:8080/api/images";

    constructor(private http: HttpClient) { }

    /**
     * (Paso 26) Sube una imagen
     * Recibe un 'File' y lo envía como FormData
     */
    public upload(image: File): Observable<ResponseDTO> {

        const formData = new FormData();
        // La llave 'file' debe coincidir con tu @RequestParam("file")
        formData.append('file', image);

        // Angular maneja el 'Content-Type: multipart/form-data' automáticamente
        return this.http.post<ResponseDTO>(this.imageUrl, formData);
    }

    /**
     * (Paso 26) Borra una imagen
     * Recibe un ID (de Cloudinary) y lo envía como Param
     */
    public delete(id: string): Observable<ResponseDTO> {
        // nuestro backend espera un @RequestParam("id"), no un @PathVariable
        // así que lo enviamos en la sección 'params'.
        return this.http.delete<ResponseDTO>(this.imageUrl, { params: { id: id } });
    }
}