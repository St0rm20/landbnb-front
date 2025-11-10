import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostPropertiesComponent } from './host-properties.component';

describe('HostPropertiesComponent', () => {
  let component: HostPropertiesComponent;
  let fixture: ComponentFixture<HostPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
