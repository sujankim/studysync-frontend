import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRoomDialog } from './create-room-dialog';

describe('CreateRoomDialog', () => {
  let component: CreateRoomDialog;
  let fixture: ComponentFixture<CreateRoomDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRoomDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRoomDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
