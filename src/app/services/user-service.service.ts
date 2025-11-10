import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// DTOs
import { ResponseDTO } from '../models/response-dto.interface';
import { UpdateProfileDTO } from '../models/update-profile-dto.interface';
import { ChangePasswordDTO } from '../models/change-password-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private usersURL = "http://localhost:8080/api/users";

    constructor(private http: HttpClient) { }

    /**
     * (Punto 5. Get Profile)
     */
    public getProfile(): Observable<ResponseDTO> {
        return this.http.get<ResponseDTO>(`${this.usersURL}/profile`);
    }

    /**
     * (Update Profile)
     */
    public updateProfile(dto: UpdateProfileDTO): Observable<ResponseDTO> {
        return this.http.put<ResponseDTO>(`${this.usersURL}/profile`, dto);
    }

    /**
     * (Change Password)
     */
    public changePassword(dto: ChangePasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.usersURL}/change-password`, dto);
    }

    /**
     * (Become host)
     */
    public becomeHost(): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.usersURL}/become-host`, {});
    }

    /**
     * (Delete User Account)
     */
    public deleteAccount(): Observable<ResponseDTO> {
        return this.http.delete<ResponseDTO>(`${this.usersURL}/delete-account`);
    }

    // ( ... otros métodos como getProfilePlaces() ... )
}