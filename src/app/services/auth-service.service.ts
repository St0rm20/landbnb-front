import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

    /**
     * (Punto 2. User Login)
     */
    public login(loginDTO: LoginDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/login`, loginDTO);
    }

    /**
     * (Punto 1. New User Registration)
     * (Movido de UserService a AuthService)
     */
    public register(dto: CreateUserDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/register`, dto);
    }

    /**
     * (Punto 3. Request Password Reset)
     */
    public forgotPassword(dto: ForgotPasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/forgot-password`, dto);
    }

    /**
     * (Punto 4. Reset Password with Token)
     */
    public resetPassword(dto: ResetPasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.authURL}/reset-password`, dto);
    }

}