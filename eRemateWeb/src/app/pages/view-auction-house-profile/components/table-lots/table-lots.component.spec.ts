import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableLotsComponent } from './table-lots.component';
describe('TableLotsComponent', () => {
  let component: TableLotsComponent;
  let fixture: ComponentFixture<TableLotsComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableLotsComponent]
    })
    .compileComponents();
    fixture = TestBed.createComponent(TableLotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
