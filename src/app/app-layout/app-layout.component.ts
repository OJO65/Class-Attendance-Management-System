import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [NavbarComponent, NgIf],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent {
  shouldShowNavbar: boolean = true;

  constructor(private router: Router) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.shouldShowNavbar = !['/login', '/register'].includes(event.url);
      }
    });
  }
}
