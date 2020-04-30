import { Component, OnInit } from '@angular/core';
import { createAnimation } from '@ionic/core';
import { Platform } from '@ionic/angular';

import { v4 as uuidv4 } from 'uuid';
import {
    VimeetServerService,
    IMessage,
    IObject as IObjectInput,
} from '../vimeet-server.service';

interface IInstant {
    icon: string;
    uuid: string;
    leftOffset: number;
}

interface IUser {
    name: string;
    elevated: boolean;
}

interface IObjectDefinition {
    getButtonText: (name: string) => string;
    listText: string;
    shortListText: string;
    object: string;
}

interface IObject {
    text: string;
    fromSelf: boolean;
    object: string;
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
    public users: IUser[] = [];
    public objects: IObject[] = [];

    public objectDefinitions: IObjectDefinition[] = [
        {
            object: 'say something',
            listText: 'I want to say something',
            shortListText: 'Say sth.!',
            getButtonText: (name: string) => `${name} wants to say something.`,
        },
        {
            object: 'ready',
            listText: 'I am ready',
            shortListText: 'Ready!',
            getButtonText: (name: string) => `${name} is ready.`,
        },
        {
            object: 'faster',
            listText: 'I want to go faster',
            shortListText: 'Faster!',
            getButtonText: (name: string) => `${name} wants to go faster.`,
        },
        {
            object: 'slower',
            listText: 'I want to go slower',
            shortListText: 'Slower!',
            getButtonText: (name: string) => `${name} wants to go slower.`,
        },
        {
            object: 'break',
            listText: 'I need a break',
            shortListText: 'Break!',
            getButtonText: (name: string) => `${name} needs a break.`,
        },
    ];

    public expandables: { [key: string]: boolean } = {
        users: false,
        polls: false,
        objects: false,
        chat: false,
    };
    public expandHeight = 100; // init value random

    constructor(
        public platform: Platform,
        private vimeet: VimeetServerService
    ) {
        this.vimeet.instant.subscribe((msg: IMessage) => {
            if (typeof msg.object === 'string') {
                this.showInstant(msg.object);
            }
        });
        this.vimeet.users.subscribe((users: IUser[]) => {
            this.users = users;
        });
        this.vimeet.objects.subscribe((objs: IObjectInput[]) => {
            this.objects = objs.map((obj) => {
                const fun = this.objectDefinitions.filter(
                    (def) => def.object === obj.object
                )[0];
                return {
                    text: fun.getButtonText(obj.owner_name),
                    fromSelf: obj.owner_id === this.vimeet.selfId,
                    object: obj.object,
                };
            });
        });
    }

    ngOnInit() {}

    public sendInstant(instant: string) {
        this.vimeet.sendInstant(instant);
    }

    public raise(object: string) {
        this.vimeet.raiseObject(object);
    }

    public lower(object: string) {
        this.vimeet.lowerObject(object);
    }

    private showInstant(instant: string) {
        if (!instant) {
            return;
        }
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

    expandItem(expandable: string): void {
        this.expandables[expandable] = !this.expandables[expandable];

        const numExpanded = Object.values(this.expandables).filter((ex) => ex)
            .length;
        const height =
            (window.innerHeight -
                60 -
                60 -
                70 * Object.values(this.expandables).length) /
            (numExpanded ? numExpanded : 1);
        this.expandHeight = height;
    }
}
