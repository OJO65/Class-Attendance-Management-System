import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router) {}
  logout() {
    this.authService.logout();
  }

  getUserRole(): string | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  getDashboardRoute(): string {
    const role = this.getUserRole();
    return role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
  }
}
