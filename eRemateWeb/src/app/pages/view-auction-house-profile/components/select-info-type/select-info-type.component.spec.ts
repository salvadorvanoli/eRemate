import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectInfoTypeComponent } from './select-info-type.component';

describe('SelectInfoTypeComponent', () => {
  let component: SelectInfoTypeComponent;
  let fixture: ComponentFixture<SelectInfoTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectInfoTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectInfoTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
