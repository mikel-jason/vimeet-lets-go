import { Component, OnInit } from '@angular/core';
import { createAnimation } from '@ionic/core';
import { Platform } from '@ionic/angular';

import { v4 as uuidv4 } from 'uuid';
import { VimeetServerService, IMessage } from '../vimeet-server.service';

interface IInstant {
    icon: string;
    uuid: string;
    leftOffset: number;
}

const ANIMATION_DURATION = 3000; // ms
const ANIMATION_OFFSET = 200; // ms, offset to make sure element exists on play

@Component({
    selector: 'app-room',
    templateUrl: './room.page.html',
    styleUrls: ['./room.page.scss'],
})
export class RoomPage implements OnInit {
    public readonly instantsAvailable = ['thumbs-up', 'thumbs-down'];
    public instants: IInstant[] = [];

    constructor(
        private platform: Platform,
        private vimeet: VimeetServerService
    ) {
        this.vimeet.messages.subscribe((msg: IMessage) => {
            console.log('Got new message incoming!');
            switch (msg.type) {
                case 'instant':
                    this.showInstant(msg.object);
                    break;
                default:
                    console.log(msg);
                    break;
            }
        });
    }

    ngOnInit() {}

    public sendInstant(instant: string) {
        this.vimeet.sendInstant(instant);
    }

    private showInstant(instant: string) {
        const uuid = 'instant-' + uuidv4(); // css ids have to start with a letter, uuid can have number as first char.
        this.instants.push({
            icon: instant,
            uuid,
            leftOffset: this.getRandomOffset(),
        });
        setTimeout(
            () => {
                const animation = this.createInstantAnimation(uuid);
                animation.play();
            },
            ANIMATION_OFFSET,
            uuid
        );
    }

    private getRandomOffset() {
        const res =
            this.platform.width() * 0.2 +
            Math.random() * this.platform.width() * 0.6;
        return res;
    }

    private createInstantAnimation(elementId: string) {
        return createAnimation()
            .addElement(document.querySelector(`.${elementId}`))
            .easing('ease-in-out')
            .duration(ANIMATION_DURATION)
            .direction('alternate')
            .iterations(1)
            .keyframes([
                {
                    offset: 0,
                    transform: 'translateY(0px) scale(0.01)',
                    opacity: '0',
                },
                {
                    offset: 0.01,
                    transform: `translateY(${
                        this.platform.height() * 0.9
                    }px) scale(0.01)`,
                    opacity: '0',
                },
                {
                    offset: 0.2,
                    transform: `translateY(${
                        this.platform.height() * 0.8
                    }px) scale(1)`,
                    opacity: '1',
                },
                {
                    offset: 1,
                    transform: `translateY(${
                        this.platform.height() * 0.4
                    }px) scale(6)`,
                    opacity: '0',
                },
            ]);
    }
}
