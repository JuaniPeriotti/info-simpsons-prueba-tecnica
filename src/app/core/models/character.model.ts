import { Episode } from './episode.model';

export interface Character {
  id: number;
  name: string;
  age: number | null;
  birthdate: string | null;
  gender: string | null;
  occupation: string | null;
  portrait_path: string | null;
  phrases: string[];
  status: string | null;
}

export interface CharacterDetail extends Character {
  description: string | null;
  first_appearance_ep?: Episode | null;
  first_appearance_sh?: Episode | null;
}

export interface CharactersPage {
  count: number;
  next: string | null;
  prev: string | null;
  pages: number;
  results: Character[];
}
