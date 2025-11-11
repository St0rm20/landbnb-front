import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptorInterceptor } from './security/jwt-interceptor.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        importProvidersFrom(ReactiveFormsModule),
        provideHttpClient(
            withInterceptors([jwtInterceptorInterceptor])
        )

    ]
};
