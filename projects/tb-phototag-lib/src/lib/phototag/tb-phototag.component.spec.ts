import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbPhototagComponent } from './tb-phototag.component';

describe('TbPhototagComponent', () => {
  let component: TbPhototagComponent;
  let fixture: ComponentFixture<TbPhototagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbPhototagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbPhototagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
