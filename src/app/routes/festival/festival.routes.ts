import { Routes } from '@angular/router';
import { ArtistesComponent } from './artistes/artistes';
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
];
