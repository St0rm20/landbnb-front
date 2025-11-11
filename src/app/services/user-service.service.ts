import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ResponseDTO } from '../models/response-dto.interface';
import { UpdateProfileDTO } from '../models/update-profile-dto.interface';
import { ChangePasswordDTO } from '../models/change-password-dto.interface';


import { UserDto } from '../models/user-dto.interface';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private usersURL = "http://localhost:8080/api/users";

    constructor(private http: HttpClient) { }


    public getProfile(): Observable<UserDto> {
        return this.http.get<UserDto>(`${this.usersURL}/profile`);
    }

    // ... (El resto de tus métodos: updateProfile, changePassword, etc.)
    public updateProfile(dto: UpdateProfileDTO): Observable<ResponseDTO> {
        return this.http.put<ResponseDTO>(`${this.usersURL}/profile`, dto);
    }

    public changePassword(dto: ChangePasswordDTO): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.usersURL}/change-password`, dto);
    }

    public becomeHost(): Observable<ResponseDTO> {
        return this.http.post<ResponseDTO>(`${this.usersURL}/become-host`, {});
    }

    public deleteAccount(): Observable<ResponseDTO> {
        return this.http.delete<ResponseDTO>(`${this.usersURL}/delete-account`);
    }
}