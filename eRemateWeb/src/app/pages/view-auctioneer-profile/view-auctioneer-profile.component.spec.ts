import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAuctioneerProfileComponent } from './view-auctioneer-profile.component';

describe('ViewAuctioneerProfileComponent', () => {
  let component: ViewAuctioneerProfileComponent;
  let fixture: ComponentFixture<ViewAuctioneerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAuctioneerProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAuctioneerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
