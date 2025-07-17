import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimilitudFacialComponent } from './similitud-facial.component';

describe('SimilitudFacialComponent', () => {
  let component: SimilitudFacialComponent;
  let fixture: ComponentFixture<SimilitudFacialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimilitudFacialComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SimilitudFacialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
