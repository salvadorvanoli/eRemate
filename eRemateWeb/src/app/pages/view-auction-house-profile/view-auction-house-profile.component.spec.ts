import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAuctionHouseProfileComponent } from './view-auction-house-profile.component';

describe('ViewAuctionHouseProfileComponent', () => {
  let component: ViewAuctionHouseProfileComponent;
  let fixture: ComponentFixture<ViewAuctionHouseProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAuctionHouseProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAuctionHouseProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
