import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Character } from '../../core/models/character.model';
import { cdnImageUrl } from '../../core/image-url';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-character-card',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './character-card.component.html',
  styleUrl: './character-card.component.css'
})
export class CharacterCardComponent {
  private readonly favorites = inject(FavoritesService);

  readonly character = input.required<Character>();

  readonly imageUrl = () => cdnImageUrl(this.character().portrait_path, 200);
  readonly isFavorite = () => this.favorites.isFavorite(this.character().id);

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.character().id);
  }
}
