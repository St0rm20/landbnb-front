import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Importa los servicios
import { UserService } from '../../services/user-service.service';
import { TokenService } from '../../services/token-service.service';

@Component({
  selector: 'app-become-host',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './become-host.component.html',
  styleUrls: ['./become-host.component.css']
})
export class BecomeHostComponent {

  // Lógica de Dropdown (si copias el navbar de home)
  dropdownOpen = false;
  isLoggedIn: boolean = false;
  userName: string = '';
  userEmail: string = '';
  userRole: string = '';

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private router: Router
  ) {
    // (Cargamos los datos del usuario para el navbar)
    this.isLoggedIn = this.tokenService.isLogged();
    if (this.isLoggedIn) {
      this.userEmail = this.tokenService.getEmail();
      this.userRole = this.tokenService.getRole();
    }
  }

  /**
   * Llama al backend para cambiar el rol del usuario
   */
  public confirmBecomeHost(): void {
    
    this.userService.becomeHost().subscribe({
      next: (data: any) => { // 'data' es InfoDto

        // Borramos el token "USER" obsoleto
        this.tokenService.logout();

        // Mostramos el SweetAlert
        Swal.fire({
          title: '¡Felicidades!',
          text: data.message || 'Tu cuenta de anfitrión ha sido activada. Por favor, inicia sesión de nuevo.',
          icon: 'success',
          confirmButtonText: 'Iniciar Sesión'
        }).then((result) => {
          // 3. Redirigimos al Login
          this.router.navigate(['/login']);
        });

      },
      error: (error: any) => {
        Swal.fire({
          title: 'Error',
          text: error.error.message || 'No se pudo activar tu cuenta de anfitrión.',
          icon: 'error'
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
}