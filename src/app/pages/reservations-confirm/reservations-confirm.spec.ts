import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsConfirmComponent } from './reservations-confirm.component';

describe('ReservationsConfirmComponent', () => {
  let component: ReservationsConfirmComponent;
  let fixture: ComponentFixture<ReservationsConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsConfirmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
