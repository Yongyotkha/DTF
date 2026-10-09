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
import { RequestsPage } from './pages/requests/requests-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPage },
  { path: 'register', component: RegisterPage },
  { path: 'register/:kind/:step', component: RegisterStepPage },
  { path: 'home', component: HomePage },
  { path: 'requests', component: RequestsPage },
  { path: 'requests/draft/:id', component: DraftPage },
  { path: 'requests/:code', component: CasePage },
  { path: 'profile', component: ProfilePage },
  { path: 'design-system', component: DesignSystemPage },
];
