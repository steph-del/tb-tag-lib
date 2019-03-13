import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbTagComponent } from './tag/tb-tag.component';

describe('TbTagComponent', () => {
  let component: TbTagComponent;
  let fixture: ComponentFixture<TbTagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbTagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
