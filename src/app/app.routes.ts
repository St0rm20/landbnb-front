import { Routes } from '@angular/router';

//  IMPORTA TUS GUARDS AQUÍ
import { AuthGuard } from './guards/auth-guard';
import { HostRoleGuard } from './guards/host-role-guard';

// Tus componentes
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';

export const routes: Routes = [

    // --- RUTAS PÚBLICAS (Cualquiera puede ver) ---
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'detalle-alojamiento/:id', component: PropertyDetailComponent },
    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./pages/forgot-password/forgot-password.component')
                .then(m => m.ForgotPasswordComponent),
    },

    {
        path: 'change-password',
        loadComponent: () =>
            import('./pages/change-password/change-password.component')
                .then(m => m.ChangePasswordComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'profile-user', // Quizás renombrar a 'profile'
        loadComponent: () =>
            import('./pages/profile-user/profile-user.component')
                .then(m => m.ProfileUserComponent),
        canActivate: [AuthGuard]
    },

    {
        path: 'leave-review',
        loadComponent: () =>
            import('./pages/leave-review/leave-review.component').then(
                (m) => m.LeaveReviewComponent
            ),
        canActivate: [AuthGuard]
    },
    {
        path: 'leave-review/:id',
        loadComponent: () =>
            import('./pages/leave-review/leave-review.component')
                .then(m => m.LeaveReviewComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'reservations-history',
        loadComponent: () =>
            import('./pages/reservations-history/reservations-history.component')
                .then(m => m.ReservationsHistoryComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'reservations-confirm/:id',
        loadComponent: () =>
            import('./pages/reservations-confirm/reservations-confirm.component')
                .then(m => m.ReservationsConfirmComponent),
        canActivate: [AuthGuard]
    },
    {
        path: 'become-host',
        loadComponent: () =>
            import('./pages/become-host/become-host.component')
                .then(m => m.BecomeHostComponent),
        canActivate: [AuthGuard]
    },

    {
        path: 'create-place',
        loadComponent: () => import('./pages/create-place/create-place.component').then(m => m.CreatePlaceComponent),
        canActivate: [AuthGuard, HostRoleGuard]
    },
    {
        path: 'accommodations-management/:id',
        loadComponent: () =>
            import('./pages/accommodations-management/accommodations-management.component')
                .then(m => m.AccommodationsManagementComponent),
        canActivate: [AuthGuard, HostRoleGuard]
    },
    {
        path: 'host-properties',
        loadComponent: () =>
            import('./pages/host-properties/host-properties.component')
                .then(m => m.HostPropertiesComponent),
        canActivate: [AuthGuard, HostRoleGuard]
    },
    {
        path: 'reservations-host',
        loadComponent: () =>
            import('./pages/reservations-host/reservations-host.component')
                .then(m => m.ReservationsHostComponent),
        canActivate: [AuthGuard, HostRoleGuard]
    },
    {
        path: 'statistics',
        loadComponent: () =>
            import('./pages/statistics/statistics.component')
                .then(m => m.StatisticsComponent),
        canActivate: [AuthGuard, HostRoleGuard]
    },


    {
        path: 'es',
        redirectTo: '',
        pathMatch: 'full'
    },
    { path: '**', redirectTo: '/home' }
];