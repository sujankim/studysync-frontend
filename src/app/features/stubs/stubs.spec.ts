import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stubs } from './stubs';

describe('Stubs', () => {
  let component: Stubs;
  let fixture: ComponentFixture<Stubs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stubs],
    }).compileComponents();

    fixture = TestBed.createComponent(Stubs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
