import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'detalle-alojamiento/:id', component: PropertyDetailComponent },
    {
        path: 'create-place',
        loadComponent: () => import('./pages/create-place/create-place.component').then(m => m.CreatePlaceComponent)
    },
    {
        path: 'accommodations-management',
        loadComponent: () => import('./pages/accommodations-management/accommodations-management.component')
            .then(m => m.AccommodationManagementComponent)
    },
    { path: '**', redirectTo: '' },
];
