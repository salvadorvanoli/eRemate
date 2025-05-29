import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoldSubtitleComponent } from './bold-subtitle.component';

describe('BoldSubtitleComponent', () => {
  let component: BoldSubtitleComponent;
  let fixture: ComponentFixture<BoldSubtitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoldSubtitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoldSubtitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
