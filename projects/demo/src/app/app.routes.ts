import { Routes } from '@angular/router';
import { BasicComponent } from './examples/basic.component';
import { StickyKeyboardComponent } from './examples/sticky-keyboard.component';
import { MultiMeasureComponent } from './examples/multi-measure.component';
import { VirtualizationComponent } from './examples/virtualization.component';
import { FiltersComponent } from './examples/filters.component';
import { TemplatesComponent } from './examples/templates.component';
import { ColumnsComponent } from './examples/columns.component';

export const routes: Routes = [
  { path: '', component: BasicComponent },
  { path: 'sticky-keyboard', component: StickyKeyboardComponent },
  { path: 'multi-medida', component: MultiMeasureComponent },
  { path: 'virtualizacao', component: VirtualizationComponent },
  { path: 'filtros', component: FiltersComponent },
  { path: 'templates', component: TemplatesComponent },
  { path: 'colunas', component: ColumnsComponent },
  { path: '**', redirectTo: '' },
];





