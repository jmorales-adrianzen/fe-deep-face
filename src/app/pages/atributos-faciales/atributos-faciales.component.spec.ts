import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtributosFacialesComponent } from './atributos-faciales.component';

describe('AtributosFacialesComponent', () => {
  let component: AtributosFacialesComponent;
  let fixture: ComponentFixture<AtributosFacialesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtributosFacialesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtributosFacialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
