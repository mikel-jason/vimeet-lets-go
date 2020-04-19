import { TestBed } from '@angular/core/testing';

import { VimeetServerService } from './vimeet-server.service';

describe('VimeetServerService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: VimeetServerService = TestBed.get(VimeetServerService);
        expect(service).toBeTruthy();
    });
});
