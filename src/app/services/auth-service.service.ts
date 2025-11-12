import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

// DTOs
import { ResponseDTO } from '../models/response-dto.interface';
import { LoginDTO } from '../models/login-dto.interface';
import { CreateUserDTO } from '../models/create-user-dto.interface';
import { ForgotPasswordDTO } from '../models/forgot-password-dto.interface';
import { ResetPasswordDTO } from '../models/reset-password-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private authURL = "http://localhost:8080/api/auth";

    constructor(private http: HttpClient) { }

    public login(loginDTO: LoginDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/login`, loginDTO);
    }

    public register(createUserDTO: CreateUserDTO): Observable<any> {
        console.log('Enviando petición de registro:', createUserDTO);

        return this.http.post(`${this.authURL}/register`, createUserDTO).pipe(
            catchError((error: any) => {
                console.error('Error completo del servidor:', error);
                console.error(' Respuesta del error:', error.error);

                // Manejo detallado de errores
                if (error.status === 400) {
                    // Mostrar detalles específicos del error 400
                    let detailedMessage = 'Datos inválidos. ';

                    if (error.error && error.error.errors) {
                        const validationErrors = Object.values(error.error.errors).flat();
                        detailedMessage += `Errores: ${validationErrors.join(', ')}`;
                    } else if (error.error && error.error.message) {
                        detailedMessage += error.error.message;
                    }

                    return throwError(() => new Error(detailedMessage));
                } else if (error.status === 409) {
                    return throwError(() => new Error('El usuario ya existe.'));
                } else if (error.status === 0) {
                    return throwError(() => new Error('Error de conexión. Verifica tu internet.'));
                } else {
                    return throwError(() => new Error(error.error?.message || 'Error del servidor'));
                }
            })
        );
    }

    public forgotPassword(dto: ForgotPasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/forgot-password`, dto);
    }

    public resetPassword(dto: ResetPasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/reset-password`, dto);
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('authToken');
    }

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }

    getToken(): string | null {
        return localStorage.getItem('authToken');
    }
}