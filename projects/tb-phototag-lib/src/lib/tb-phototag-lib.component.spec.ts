import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbPhototagLibComponent } from './phototag/tb-phototag-lib.component';

describe('TbPhototagLibComponent', () => {
  let component: TbPhototagLibComponent;
  let fixture: ComponentFixture<TbPhototagLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbPhototagLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbPhototagLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
