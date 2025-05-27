import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRegisteredUserProfileComponent } from './view-registered-user-profile.component';

describe('ViewRegisteredUserProfileComponent', () => {
  let component: ViewRegisteredUserProfileComponent;
  let fixture: ComponentFixture<ViewRegisteredUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRegisteredUserProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRegisteredUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
