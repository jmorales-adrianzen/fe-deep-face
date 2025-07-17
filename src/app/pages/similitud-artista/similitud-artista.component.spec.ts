import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimilitudArtistaComponent } from './similitud-artista.component';

describe('SimilitudArtistaComponent', () => {
  let component: SimilitudArtistaComponent;
  let fixture: ComponentFixture<SimilitudArtistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimilitudArtistaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SimilitudArtistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
