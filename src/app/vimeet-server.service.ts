import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
    constructor() {}

    public sendInstant(value: string) {
        console.log(`[VimeetServerService.sendInstant] ${value}`);
    }
}
