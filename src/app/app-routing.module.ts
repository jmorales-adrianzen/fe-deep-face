import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AtributosFacialesComponent } from './components/atributos-faciales/atributos-faciales.component';
import { FotoAnalyzerComponent } from './components/foto-analyzer/foto-analyzer.component';
import { ParecidoPadresComponent } from './pages/parecido-padres/parecido-padres.component';
import { SimilitudArtistaComponent } from './pages/similitud-artista/similitud-artista.component';



const routes: Routes = [
  { path: '', redirectTo: '/atributos-faciales', pathMatch: 'full' },
  { path: 'atributos-faciales', component: AtributosFacialesComponent },  
  { path: 'foto-analyzer', component: FotoAnalyzerComponent },
  { path: 'parecido-padres', component: ParecidoPadresComponent },
  { path: 'similitud-artista', component: SimilitudArtistaComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}