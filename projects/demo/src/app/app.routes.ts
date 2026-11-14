import { Routes } from '@angular/router';
import { BasicComponent } from './examples/basic.component';
import { StickyKeyboardComponent } from './examples/sticky-keyboard.component';

export const routes: Routes = [
  { path: '', component: BasicComponent },
  { path: 'sticky-keyboard', component: StickyKeyboardComponent },
  { path: '**', redirectTo: '' },
];
