import { Routes } from '@angular/router';
import { ArtistesComponent } from './artistes/artistes';
import { ConcertFormComponent } from './concerts/concert-form';
import { ConcertsComponent } from './concerts/concerts';
import { EvenementsComponent } from './evenements/evenements';
import { FestivalsComponent } from './festivals/festivals';
import { LieuxComponent } from './lieux/lieux';
import { UtilisateursComponent } from './utilisateurs/utilisateurs';

export const routes: Routes = [
  { path: 'festivals', component: FestivalsComponent },
  { path: 'lieux', component: LieuxComponent },
  { path: 'utilisateurs', component: UtilisateursComponent },
  { path: 'artistes', component: ArtistesComponent },
  { path: 'evenements', component: EvenementsComponent },
  { path: 'concerts', component: ConcertsComponent },
  { path: 'concerts/new', component: ConcertFormComponent },
  { path: 'concerts/edit/:id', component: ConcertFormComponent },
];
