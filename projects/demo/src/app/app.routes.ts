import { Routes } from '@angular/router';
import { BasicComponent } from './examples/basic.component';
import { StickyKeyboardComponent } from './examples/sticky-keyboard.component';
import { MultiMeasureComponent } from './examples/multi-measure.component';

export const routes: Routes = [
  { path: '', component: BasicComponent },
  { path: 'sticky-keyboard', component: StickyKeyboardComponent },
  { path: 'multi-medida', component: MultiMeasureComponent },
  { path: '**', redirectTo: '' },
];

