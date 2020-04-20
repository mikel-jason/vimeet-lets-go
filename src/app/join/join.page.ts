import { Component } from '@angular/core';
import { VimeetServerService } from '../vimeet-server.service';

@Component({
    selector: 'app-join',
    templateUrl: 'join.page.html',
    styleUrls: ['join.page.scss'],
})
export class JoinPage {
    username: string;
    room: string;

    constructor(private vimeet: VimeetServerService) {}

    connect() {
        if (this.username && this.room) {
            this.vimeet.connect(this.username, this.room);
        }
    }
}
