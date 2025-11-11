import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';


export const routes: Routes = [

    { path: '', redirectTo: '/login', pathMatch: 'full' },

    { path: 'home', component: HomeComponent },


    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'detalle-alojamiento/:id', component: PropertyDetailComponent },
    {
        path: 'create-place',
        loadComponent: () => import('./pages/create-place/create-place.component').then(m => m.CreatePlaceComponent)
    },
    {
        path: 'accommodations-management',
        loadComponent: () =>
            import('./pages/accommodations-management/accommodations-management.component')
                .then(m => m.AccommodationManagementComponent)
    },

    {
        path: 'leave-review',
        loadComponent: () =>
            import('./pages/leave-review/leave-review.component').then(
                (m) => m.LeaveReviewComponent
            ),
    },

    {
        path: 'reservations-history',
        loadComponent: () =>
            import('./pages/reservations-history/reservations-history.component')
                .then(m => m.ReservationsHistoryComponent),
    },

    {
        path: 'host-properties',
        loadComponent: () =>
            import('./pages/host-properties/host-properties.component')
                .then(m => m.HostPropertiesComponent),
    },

    {
        path: 'change-password',
        loadComponent: () =>
            import('./pages/change-password/change-password.component')
                .then(m => m.ChangePasswordComponent),
    },

    {
        path: 'profile-user',
        loadComponent: () =>
            import('./pages/profile-user/profile-user.component')
                .then(m => m.ProfileUserComponent),
    },

    {
        path: 'become-host',
        loadComponent: () =>
            import('./pages/become-host/become-host.component')
                .then(m => m.BecomeHostComponent),
    },

    {
        path: 'forgot-password',
        loadComponent: () =>
            import('./pages/forgot-password/forgot-password.component')
                .then(m => m.ForgotPasswordComponent),
    },

    {
        path: 'reservations-host',
        loadComponent: () =>
            import('./pages/reservations-host/reservations-host.component')
                .then(m => m.ReservationsHostComponent),
    },

    {
        path: 'reservations-confirm',
        loadComponent: () =>
            import('./pages/reservations-confirm/reservations-confirm.component')
                .then(m => m.ReservationsConfirmComponent),
    },

    {
        path: 'statistics',
        loadComponent: () =>
            import('./pages/statistics/statistics.component')
                .then(m => m.StatisticsComponent),
    },

    {
        path: 'es',
        redirectTo: '',
        pathMatch: 'full'
    },

];