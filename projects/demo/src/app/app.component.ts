import { Component } from '@angular/core';
import { PivotGridComponent } from '@leonardohessel/pivot-grid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PivotGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'pivot-grid demo';
}

