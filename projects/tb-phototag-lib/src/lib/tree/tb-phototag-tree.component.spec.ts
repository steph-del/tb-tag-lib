import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbPhototagTreeLibComponent } from './tb-phototag-tree.component';

describe('TbPhototagTreeLibComponent', () => {
  let component: TbPhototagTreeLibComponent;
  let fixture: ComponentFixture<TbPhototagTreeLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbPhototagTreeLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbPhototagTreeLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
