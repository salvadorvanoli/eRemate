import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableAuctionAuctioneerComponent } from './table-auction-auctioneer.component';

describe('TableAuctionAuctioneerComponent', () => {
  let component: TableAuctionAuctioneerComponent;
  let fixture: ComponentFixture<TableAuctionAuctioneerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableAuctionAuctioneerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableAuctionAuctioneerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
