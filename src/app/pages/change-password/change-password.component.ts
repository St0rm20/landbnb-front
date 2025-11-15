import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user-service.service';
import { TokenService } from '../../services/token-service.service';
import { ChangePasswordDTO } from '../../models/change-password-dto.interface';
import { UserDto } from '../../models/user-dto.interface';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule
    ]
})
export class ChangePasswordComponent implements OnInit {

    changePasswordForm!: FormGroup;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    // --- Propiedades del Navbar ---
    dropdownOpen = false;
    userName: string = '';
    userEmail: string = '';
    isLoggedIn: boolean = false;
    userRole: string = '';
    profilePicUrl: string = 'assets/imagenes/perfil.png';
    isUser: boolean = false;
    isHost: boolean = false;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private tokenService: TokenService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initializeAuth();
        this.initializeForm();
        this.loadUserProfile();
    }

    /**
     * Inicializa la autenticación y verifica el login
     */
    private initializeAuth(): void {
        this.isLoggedIn = this.tokenService.isLogged();
        this.userRole = this.tokenService.getRole();
        this.userEmail = this.tokenService.getEmail();

        // Determinar si es usuario o host
        this.isUser = this.userRole === 'USER';
        this.isHost = this.userRole === 'HOST';

        if (!this.isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
    }

    /**
     * Inicializa el formulario reactivo con validaciones
     */
    private initializeForm(): void {
        this.changePasswordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, {
            validators: this.passwordMatcher
        });
    }

    /**
     * Carga el perfil del usuario para la navbar
     */
    loadUserProfile(): void {
        this.userService.getProfile().subscribe({
            next: (data: UserDto) => {
                this.userName = `${data.name} ${data.lastName}`.trim();
                if (data.profilePictureUrl) {
                    this.profilePicUrl = this.fixCloudinaryUrl(data.profilePictureUrl);
                } else {
                    this.profilePicUrl = 'assets/imagenes/perfil.png';
                }
            },
            error: (error: any) => {
                console.error("Error cargando perfil", error);
                this.userName = this.userEmail;
                this.profilePicUrl = 'assets/imagenes/perfil.png';
            }
        });
    }

    /**
     * Corrige URLs de Cloudinary
     */
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

    /**
     * Maneja errores de carga de imagen de perfil
     */
    handleImageError(event: Event): void {
        const imgElement = event.target as HTMLImageElement;
        console.warn('Error cargando imagen de perfil, usando imagen por defecto');
        imgElement.src = 'assets/imagenes/perfil.png';
        imgElement.onerror = null;
    }

    /**
     * Validador personalizado para verificar que las contraseñas coincidan
     */
    private passwordMatcher(control: AbstractControl): ValidationErrors | null {
        const newPassword = control.get('newPassword');
        const confirmPassword = control.get('confirmPassword');

        if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    /**
     * Getter para acceder a los controles del formulario
     */
    get f() {
        return this.changePasswordForm.controls;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        this.errorMessage = null;
        this.successMessage = null;

        if (this.changePasswordForm.invalid) {
            this.changePasswordForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        const { currentPassword, newPassword } = this.changePasswordForm.value;

        const dto: ChangePasswordDTO = {
            currentPassword: currentPassword,
            newPassword: newPassword
        };

        this.userService.changePassword(dto).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.successMessage = response.content || "¡Contraseña actualizada correctamente!";
                this.changePasswordForm.reset();

                // Limpiar el mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    this.successMessage = null;
                }, 5000);
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Error al cambiar contraseña:', error);

                // Manejo detallado de errores
                if (error.status === 401) {
                    this.errorMessage = "La contraseña actual no es correcta.";
                } else if (error.status === 400) {
                    this.errorMessage = error.error?.message || "Datos inválidos. Verifica la información ingresada.";
                } else if (error.status === 0) {
                    this.errorMessage = "Error de conexión. Verifica tu internet.";
                } else {
                    this.errorMessage = error.error?.message || "Error al cambiar la contraseña. Inténtalo nuevamente.";
                }
            }
        });
    }

    /**
     * Cerrar dropdown al hacer clic fuera
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            this.dropdownOpen = false;
        }
    }

    /**
     * Toggle del menú dropdown
     */
    toggleDropdown(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.dropdownOpen = !this.dropdownOpen;
    }

    /**
     * Cerrar sesión
     */
    logout(event: Event): void {
        event.preventDefault();
        this.tokenService.logout();
        this.router.navigate(['/login']).then(() => window.location.reload());
    }
}