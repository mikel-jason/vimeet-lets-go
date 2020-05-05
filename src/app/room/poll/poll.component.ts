import { Component, OnInit, Input } from '@angular/core';

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

    constructor() {}

    ngOnInit() {}

    private calculate_votes_for_option(option_title: string) {
        return this.votes.filter(
            (vote) => vote.polloptionobject == option_title
        ).length;
    }
}
