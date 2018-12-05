import { TestBed, inject } from '@angular/core/testing';

import { TbPhototagLibService } from './tb-phototag-lib.service';

describe('TbPhototagLibService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TbPhototagLibService]
    });
  });

  it('should be created', inject([TbPhototagLibService], (service: TbPhototagLibService) => {
    expect(service).toBeTruthy();
  }));
});
