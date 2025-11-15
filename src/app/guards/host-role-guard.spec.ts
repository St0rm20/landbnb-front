import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { hostRoleGuard } from './host-role-guard';

describe('hostRoleGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => hostRoleGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
