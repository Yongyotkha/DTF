import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AskAi } from './ask-ai/ask-ai';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AskAi],
  template: '<router-outlet /><app-ask-ai />',
})
export class App {}
