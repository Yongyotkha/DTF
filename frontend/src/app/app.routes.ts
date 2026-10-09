import { Routes } from '@angular/router';
import { DesignSystemPage } from './pages/design-system/design-system';
import { ForgotPage } from './pages/register/forgot-page';
import { HomePage } from './pages/home/home-page';
import { LoginPage } from './pages/login/login-page';
import { ProfilePage } from './pages/profile/profile-page';
import { RegisterPage } from './pages/register/register-page';
import { RegisterStepPage } from './pages/register/register-step-page';
import { CasePage } from './pages/requests/case-page';
import { DraftPage } from './pages/requests/draft-page';
import { Por1Page } from './pages/requests/por1-page';
import { Por2Page } from './pages/requests/por2-page';
import { RequestsPage } from './pages/requests/requests-page';
import { StaffChatPage } from './pages/requests/staff-chat-page';
import { StaffHomePage } from './pages/staff/staff-home-page';
import { StaffTaskPage } from './pages/staff/staff-task-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPage },
  { path: 'register', component: RegisterPage },
  { path: 'register/:kind/:step', component: RegisterStepPage },
  { path: 'home', component: HomePage },
  { path: 'staff', component: StaffHomePage },
  { path: 'staff/tasks/:code', component: StaffTaskPage },
  { path: 'director', component: StaffHomePage, data: { role: 'director' } },
  { path: 'director/tasks/:code', component: StaffTaskPage, data: { role: 'director' } },
  { path: 'head', component: StaffHomePage, data: { role: 'head' } },
  { path: 'head/tasks/:code', component: StaffTaskPage, data: { role: 'head' } },
  { path: 'officer', component: StaffHomePage, data: { role: 'officer' } },
  { path: 'officer/tasks/:code', component: StaffTaskPage, data: { role: 'officer' } },
  { path: 'requests', component: RequestsPage },
  { path: 'requests/por-1', component: Por1Page },
  { path: 'requests/por-2', component: Por2Page },
  { path: 'requests/draft/:id', component: DraftPage },
  { path: 'requests/chat', component: StaffChatPage },
  { path: 'requests/:code', component: CasePage },
  { path: 'profile', component: ProfilePage },
  { path: 'design-system', component: DesignSystemPage },
];
