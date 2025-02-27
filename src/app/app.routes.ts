import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './auth/register/register.component';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { TimetableComponent } from './pages/timetable/timetable.component';
import { ReportComponent } from './pages/report/report.component';

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
},
{
    path: 'teacher-dashboard',
    component: TeacherDashboardComponent
},
{
    path: 'student-dashboard',
    component: StudentDashboardComponent
},
{
    path: 'timetable',
    component: TimetableComponent
},
{
    path: 'report',
    component: ReportComponent
}
];
