import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParecidoPadresComponent } from './parecido-padres.component';

describe('ParecidoPadresComponent', () => {
  let component: ParecidoPadresComponent;
  let fixture: ComponentFixture<ParecidoPadresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParecidoPadresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParecidoPadresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
