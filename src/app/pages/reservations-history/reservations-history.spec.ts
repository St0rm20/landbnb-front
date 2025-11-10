import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsHistoryComponent } from './reservations-history.component';

describe('ReservationsHistoryComponent', () => {
  let component: ReservationsHistoryComponent;
  let fixture: ComponentFixture<ReservationsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
