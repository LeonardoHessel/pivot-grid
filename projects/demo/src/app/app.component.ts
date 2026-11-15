import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly links = [
    { path: '/', label: 'Básico', exact: true },
    { path: '/sticky-keyboard', label: 'Sticky + teclado', exact: false },
    { path: '/multi-medida', label: 'Multi-medida', exact: false },
    { path: '/virtualizacao', label: 'Virtualização', exact: false },
    { path: '/filtros', label: 'Filtros + datas', exact: false },
    { path: '/templates', label: 'Templates', exact: false },
    { path: '/colunas', label: 'Colunas', exact: false },
    { path: '/row-header', label: 'Row header', exact: false },
  ];
}






