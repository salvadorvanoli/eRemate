import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableAuctionComponent } from './table-auction.component';
describe('TableAuctionComponent', () => {
  let component: TableAuctionComponent;
  let fixture: ComponentFixture<TableAuctionComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableAuctionComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(TableAuctionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
