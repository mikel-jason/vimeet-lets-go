import { Component, OnInit, Input } from '@angular/core';
import { VimeetServerService } from 'src/app/vimeet-server.service';

@Component({
    selector: 'app-poll',
    templateUrl: './poll.component.html',
    styleUrls: ['./poll.component.scss'],
})
export class PollComponent implements OnInit {
    @Input() title: string;
    @Input() options: any[];
    @Input() votes: any[];
    @Input() closed: boolean;

    add_option: boolean = false;
    optionTitle: String;

    constructor(private vimeet: VimeetServerService) {}

    ngOnInit() {}

    public calculate_votes_for_option(option_title: string) {
        return this.votes.filter(
            (vote) => vote.polloptionobject == option_title
        ).length;
    }

    public close() {
        this.vimeet.closePoll(this.title);
    }

    public vote(option_title: String) {
        if (!this.closed) this.vimeet.vote(this.title, option_title);
    }

    public addOption() {
        if (this.optionTitle) {
            if (!this.closed)
                this.vimeet.addOption(this.title, this.optionTitle);
            this.optionTitle = '';
        }
    }
}
