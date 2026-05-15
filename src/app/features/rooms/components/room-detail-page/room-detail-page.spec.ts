import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDetailPage } from './room-detail-page';

describe('RoomDetailPage', () => {
  let component: RoomDetailPage;
  let fixture: ComponentFixture<RoomDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetailPage],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
