import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
})
export class AuthShell {
  @Input() center = false;
  @Input() copyright = false;
}
