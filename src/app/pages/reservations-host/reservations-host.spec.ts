import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsHostComponent } from './reservations-host.component.component';

describe('ReservationsHostComponent', () => {
  let component: ReservationsHostComponent;
  let fixture: ComponentFixture<ReservationsHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
