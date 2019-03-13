import { TestBed, inject } from '@angular/core/testing';

import { TbTagService } from './tb-tag-lib.service';

describe('TbTagÒLibService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TbTagService]
    });
  });

  it('should be created', inject([TbTagService], (service: TbTagService) => {
    expect(service).toBeTruthy();
  }));
});
