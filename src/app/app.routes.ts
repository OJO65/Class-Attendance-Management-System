import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [{
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
},
{
    path: 'home',
    component: HomeComponent
},
{
    path: 'login',
    component: LoginComponent
},
{
    path: 'register',
    component: RegisterComponent
}
];
