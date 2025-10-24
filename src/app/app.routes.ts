import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: '', redirectTo: '/register', pathMatch: 'full' }, // Ruta por defecto
    { path: '**', redirectTo: '/register' } // Ruta para manejar rutas no encontradas
];