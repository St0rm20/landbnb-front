import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { HostRoleGuard } from './host-role-guard';

describe('hostRoleGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => HostRoleGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
