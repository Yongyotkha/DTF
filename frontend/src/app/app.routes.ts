import { Routes } from '@angular/router';
import { AiWorkspacePage } from './pages/ai/ai-workspace-page';
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
import { Por2aPage } from './pages/requests/por2a-page';
import { Por3Page } from './pages/requests/por3-page';
import { Por3aPage } from './pages/requests/por3a-page';
import { Por4Page } from './pages/requests/por4-page';
import { Por5Page } from './pages/requests/por5-page';
import { Por6Page } from './pages/requests/por6-page';
import { Por7Page } from './pages/requests/por7-page';
import { Por8Page } from './pages/requests/por8-page';
import { SgPage } from './pages/requests/sg-page';
import { FormUploadPage } from './pages/requests/form-upload-page';
import { RequestsPage } from './pages/requests/requests-page';
import { StaffChatPage } from './pages/requests/staff-chat-page';
import { CaseRegistryPage } from './pages/staff/case-registry-page';
import { StaffHomePage } from './pages/staff/staff-home-page';
import { StaffTaskPage } from './pages/staff/staff-task-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPage },
  { path: 'register', component: RegisterPage },
  { path: 'register/:kind/:step', component: RegisterStepPage },
  { path: 'home', component: HomePage },
  { path: 'ai-workspace', component: AiWorkspacePage },
  { path: 'staff', component: StaffHomePage },
  { path: 'staff/filing', component: Por1Page, data: { review: 'staff' } },
  { path: 'staff/tasks/:code', component: StaffTaskPage },
  { path: 'director', component: StaffHomePage, data: { role: 'director' } },
  { path: 'cases', component: CaseRegistryPage },
  { path: 'director/filing', component: Por1Page, data: { review: 'director' } },
  { path: 'director/tasks/:code', component: StaffTaskPage, data: { role: 'director' } },
  { path: 'head', component: StaffHomePage, data: { role: 'head' } },
  { path: 'head/filing', component: Por1Page, data: { review: 'head' } },
  { path: 'head/tasks/:code', component: StaffTaskPage, data: { role: 'head' } },
  { path: 'officer', component: StaffHomePage, data: { role: 'officer' } },
  { path: 'officer/filing', component: Por1Page, data: { review: 'officer' } },
  { path: 'officer/tasks/:code', component: StaffTaskPage, data: { role: 'officer' } },
  { path: 'requests', component: RequestsPage },
  { path: 'requests/por-1', component: Por1Page },
  { path: 'requests/por-2', component: Por2Page },
  { path: 'requests/por-2a', component: Por2aPage },
  { path: 'requests/por-3', component: Por3Page },
  { path: 'requests/por-3a', component: Por3aPage },
  { path: 'requests/por-4', component: Por4Page },
  { path: 'requests/por-5', component: Por5Page },
  { path: 'requests/por-6', component: Por6Page },
  { path: 'requests/por-7', component: Por7Page },
  { path: 'requests/por-8', component: Por8Page },
  { path: 'requests/sg', component: SgPage, data: { form: 'request' } },
  { path: 'requests/sg-notice', component: SgPage, data: { form: 'notice' } },
  { path: 'requests/upload', component: FormUploadPage },
  { path: 'requests/draft/:id', component: DraftPage },
  { path: 'requests/chat', component: StaffChatPage },
  { path: 'requests/:code/fixes', component: CasePage, data: { view: 'fixes' } },
  { path: 'requests/:code', component: CasePage },
  { path: 'profile', component: ProfilePage },
  { path: 'design-system', component: DesignSystemPage },
];
