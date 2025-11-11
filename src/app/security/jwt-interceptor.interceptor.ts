import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token-service.service';

export const jwtInterceptorInterceptor: HttpInterceptorFn = (req, next) => {

    //  Inyectamos el TokenService
    const tokenService = inject(TokenService);

    // Obtenemos el token
    const token = tokenService.getToken();

    //  Si el token existe, clonamos la petición y le añadimos el header
    if (token) {
        const clonedReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(clonedReq);
    }

    // 4. Si no hay token, dejamos pasar la petición original
    return next(req);
};