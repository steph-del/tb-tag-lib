import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TbTagTreeComponent } from './tb-tag-tree.component';

describe('TbTagTreeLibComponent', () => {
  let component: TbTagTreeComponent;
  let fixture: ComponentFixture<TbTagTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TbTagTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TbTagTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
