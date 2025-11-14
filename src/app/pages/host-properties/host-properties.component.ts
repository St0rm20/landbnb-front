import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { filter } from 'rxjs/operators';

import { AccommodationService } from '../../services/accommodation-service.service';
import { TokenService } from '../../services/token-service.service';
import { UserService} from '../../services/user-service.service';
import { UserDto } from '../../models/user-dto.interface';
import { AccommodationDTO } from '../../models/accommodation-dto.interface';

interface DirectPagedResponse {
    content: AccommodationDTO[];
    totalPages: number;
    totalElements: number;
}

@Component({
    selector: 'app-host-properties',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './host-properties.component.html',
    styleUrls: ['./host-properties.component.css']
})
export class HostPropertiesComponent implements OnInit {

    dropdownOpen = false;
    isLoggedIn: boolean = false;
    userName: string = '';
    userEmail: string = '';
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';

    properties: AccommodationDTO[] = [];
    isLoading: boolean = true;
    page: number = 0;
    totalPages: number = 1;

    constructor(
        private router: Router,
        private accommodationService: AccommodationService,
        private tokenService: TokenService,
        private userService: UserService,
        private sanitizer: DomSanitizer
    ) {

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            if (event.urlAfterRedirects === '/host-properties') {
                this.loadMyAccommodations(0);
            }
        });
    }

    ngOnInit(): void {
        this.checkAuthentication();
        this.loadMyAccommodations(this.page);

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            if (event.urlAfterRedirects === '/host-properties') {
                this.loadMyAccommodations(0);
            }
        });
    }

    checkAuthentication(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        if (this.isLoggedIn) {
            this.userEmail = this.tokenService.getEmail();
            this.userRole = this.tokenService.getRole();
            this.loadUserProfile();
        } else {
            this.userName = '';
            this.userEmail = '';
            this.userRole = '';
            this.profilePicUrl = 'assets/imagenes/perfil.png';
        }
    }

    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = data.name;
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error: any) => {
                console.error("Error cargando perfil", error);
                this.userName = '';
                this.profilePicUrl = 'assets/imagenes/perfil.png';
            }
        });
    }

    private fixCloudinaryUrl(url: string | null | undefined): string {
        if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
            return '';
        }

        if (url.startsWith('https://')) {
            return url;
        }

        if (url.includes('cloudinary.com') && url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }

        if (url.startsWith('http://') && !url.includes('localhost')) {
            return url.replace('http://', 'https://');
        }

        if (url.includes('cloudinary.com') && !url.startsWith('http')) {
            return 'https://' + url;
        }

        return url;
    }

    handleImageError(event: Event): void {
        const imgElement = event.target as HTMLImageElement;
        console.warn('Error cargando imagen de perfil, usando imagen por defecto');
        imgElement.src = 'assets/imagenes/perfil.png';
        imgElement.onerror = null;
    }

    loadMyAccommodations(page: number): void {
        this.isLoading = true;

        this.accommodationService.getMyAccommodations(page).subscribe({
            next: (data: DirectPagedResponse | any) => {
                this.properties = data?.content || [];
                this.totalPages = data?.totalPages || 1;
                this.isLoading = false;
                console.log(`Alojamientos cargados: ${this.properties.length}`);
            },
            error: (err) => {
                this.isLoading = false;
                this.properties = [];
                console.error('Error cargando alojamientos', err);
                Swal.fire('Error', err.error.message || 'No se pudieron cargar tus alojamientos', 'error');
            }
        });
    }

    editProperty(property: AccommodationDTO): void {
        this.router.navigate(['/accommodations-management', property.id]);
    }

    deleteProperty(property: AccommodationDTO): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar "${property.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a675f',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡bórralo!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.accommodationService.delete(property.id).subscribe({
                    next: () => {
                        Swal.fire('¡Borrado!', 'Tu alojamiento ha sido eliminado.', 'success');
                        this.loadMyAccommodations(this.page);
                    },
                    error: (err) => {
                        Swal.fire('Error', err.error.message || 'No se pudo borrar el alojamiento', 'error');
                    }
                });
            }
        });
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }

    getTotalViews(): number {
        return this.properties.reduce((sum, p) => sum + (p.totalBookings || 0), 0);
    }

    getAverageRating(): string {
        const ratedProps = this.properties.filter(p => p.averageRating);
        if (ratedProps.length === 0) return '0.0';
        const sum = ratedProps.reduce((acc, p) => acc + (p.averageRating || 0), 0);
        return (sum / ratedProps.length).toFixed(1);
    }
}