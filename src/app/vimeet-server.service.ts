import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

export interface IMessage {
    type?: string;
    owner_id?: number;
    owner_name?: string;
    object?: string | object | number;
    joined?: any[];
    raised?: any[];
    elevated?: boolean;
    id?: number;
}

interface IUser {
    name: string;
    elevated: boolean;
    id: number;
}

interface IUserInput {
    [key: number]: IUser;
}

export interface IObject {
    object: string;
    owner_id: number;
    owner_name: string;
    elevated: boolean;
}

export interface IChatMessage {
    owner_name: string;
    owner_id: number;
    text: string;
    elevated: boolean;
}

export interface IPoll {
    object: string;
    options: IPollOption[];
    votes: IVote[];
    closed: boolean;
}

export interface IPollOption {
    polloptionobject: string;
    pollobject: string;
}

export interface IVote {
    userid: number;
    username: string;
    polloptionobject: string;
    pollobject: string;
}

export interface IClosePoll {
    object: string;
}

export interface IDeleteVote {
    pollobject: string;
    polloptionobject: string;
    userid: string;
}

export interface IError {
    object: string;
    description: string;
}

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
    public messages: BehaviorSubject<IMessage>;
    public users: BehaviorSubject<IUser[]>;
    public objects: BehaviorSubject<IObject[]>;
    public instant: BehaviorSubject<IMessage>;
    public chatMessage: BehaviorSubject<IChatMessage>;
    public polls: BehaviorSubject<IPoll[]>;
    public selfId: number;
    public selfElevated: BehaviorSubject<boolean>;

    private ws: WebSocketSubject<unknown>;
    private isConnected: BehaviorSubject<boolean>;

    constructor(private navCtl: NavController) {
        this.isConnected = new BehaviorSubject<boolean>(false);
        this.isConnected.subscribe((connected) => {
            if (connected) {
                this.navCtl.navigateForward('/room');
            } else {
                this.navCtl.navigateBack('/join');
            }
        });
        this.users = new BehaviorSubject([]);
        this.objects = new BehaviorSubject([]);
        this.instant = new BehaviorSubject({ type: 'init-dummy' });
        this.chatMessage = new BehaviorSubject({
            owner_name: 'Vimeet',
            owner_id: 0,
            text: 'Welcome to the chat!',
            elevated: false,
        });
        this.polls = new BehaviorSubject([]);
        this.selfElevated = new BehaviorSubject(false);
    }

    public connect(username: string, room: string) {
        const protocol = document.URL.startsWith('http:') ? 'ws' : 'wss';
        this.ws = webSocket(
            `${protocol}://${
                environment.vimeet_server_base_uri
            }/ws/${encodeURIComponent(room)}/${encodeURIComponent(username)}/`
        );

        this.ws.subscribe(
            (msg: IMessage) => {
                console.log(msg);
                this.isConnected.next(true);
                switch (msg.type) {
                    case 'selfstatus':
                        if (typeof msg.object === 'number') {
                            this.selfId = msg.object;
                        }
                        this.selfElevated.next(msg.elevated);
                        break;
                    case 'all':
                        if (msg.joined && msg.raised) {
                            const input = msg.joined as IUserInput;
                            const users = [];
                            for (const key of Object.keys(input)) {
                                const id = Number(key);
                                users.push(this.transformUser(id, input[id]));
                            }
                            users.sort(this.sortIUser);
                            this.users.next(users);

                            this.objects.next(msg.raised);
                        }
                        break;
                    case 'instant':
                        if (
                            msg.object &&
                            typeof msg.object === 'object' &&
                            msg.object.hasOwnProperty('type')
                        ) {
                            const typObj = msg.object as {
                                type: string;
                                value: string;
                            };

                            switch (typObj.type) {
                                case 'icon':
                                    this.instant.next({ object: typObj.value });
                                    break;
                                case 'chat':
                                    this.chatMessage.next({
                                        owner_name: msg.owner_name,
                                        owner_id: msg.owner_id,
                                        text: typObj.value,
                                        elevated: msg.elevated,
                                    });
                                    break;
                                default:
                                    break;
                            }
                        }
                        break;
                    case 'joined':
                        if (msg.object && typeof msg.object === 'object') {
                            const obj = msg.object;
                            if (
                                'name' in obj &&
                                'id' in obj &&
                                'elevated' in obj
                            ) {
                                const users = this.getCopy(this.users);
                                users.push(msg.object as IUser);
                                users.sort(this.sortIUser);
                                this.users.next(users);
                            }
                        }
                        break;
                    case 'raised':
                        if (msg.object && typeof msg.object === 'string') {
                            if (
                                'owner_name' in msg &&
                                'owner_id' in msg &&
                                'elevated' in msg
                            ) {
                                const objects = this.objects.getValue();
                                objects.push(msg as IObject);
                                this.objects.next(objects);
                            }
                        }
                        break;
                    case 'lower':
                        if (msg.object && typeof msg.object === 'string') {
                            if (
                                'owner_name' in msg &&
                                'owner_id' in msg &&
                                'elevated' in msg
                            ) {
                                const objects = this.objects.getValue();
                                this.objects.next(
                                    objects.filter(
                                        (obj) =>
                                            !(
                                                obj.owner_id === msg.owner_id &&
                                                obj.object === msg.object
                                            )
                                    )
                                );
                            }
                        }
                        break;
                    case 'poll': {
                        let temp_poll = msg as IPoll;

                        const polls = this.polls.getValue();

                        let new_poll = {
                            object: temp_poll.object,
                            options: [],
                            votes: [],
                            closed: false,
                        };

                        polls.push(new_poll);
                        this.polls.next(polls);
                        break;
                    }
                    case 'polloption': {
                        let poll_option = msg as IPollOption;

                        const polls = this.polls.getValue();
                        for (let i = 0; i < polls.length; i++) {
                            if (polls[i].object == poll_option.pollobject) {
                                polls[i].options.push(poll_option);
                                break;
                            }
                        }

                        this.polls.next(polls);
                        break;
                    }
                    case 'vote': {
                        let poll_vote = msg as IVote;

                        const polls = this.polls.getValue();
                        for (let i = 0; i < polls.length; i++) {
                            if (polls[i].object == poll_vote.pollobject) {
                                polls[i].votes.push(poll_vote);
                                break;
                            }
                        }

                        this.polls.next(polls);
                        break;
                    }
                    case 'pollclose': {
                        let close = msg as IClosePoll;

                        const polls = this.polls.getValue();
                        for (let i = 0; i < polls.length; i++) {
                            if (polls[i].object == close.object) {
                                polls[i].closed = true;
                                break;
                            }
                        }

                        this.polls.next(polls);
                        break;
                    }
                    case 'votedelete': {
                        let delete_vote = msg as IDeleteVote;

                        const polls = this.polls.getValue();
                        for (let i = 0; i < polls.length; i++) {
                            if (polls[i].object == delete_vote.pollobject) {
                                let index = polls[i].votes.findIndex(
                                    (vote, _, __) =>
                                        vote.polloptionobject ==
                                        delete_vote.polloptionobject
                                );
                                polls[i].votes.splice(index, 1);
                                console.log(polls[i].votes);
                                break;
                            }
                        }

                        this.polls.next(polls);
                        break;
                    }
                    case 'error':
                        let error = msg as IError;
                        alert(error.description);
                        break;
                    case 'elevated': // fall thru!
                    case 'receded':
                        if (msg.object === this.selfId) {
                            this.selfElevated.next(msg.elevated);
                        }

                        const newUsers = this.users.getValue();
                        newUsers.map((user) => {
                            if (user.id === msg.object) {
                                user.elevated = msg.elevated;
                            }
                        });
                        this.users.next(newUsers);
                        break;
                    default:
                        break;
                }
            },
            (error) => {
                console.log(error);
                this.isConnected.next(false);
            }
        );
    }

    public sendInstant(value: string) {
        this.sendMessage({
            type: 'instant',
            object: { type: 'icon', value },
        });
    }

    public sendChatMessage(message: string) {
        this.sendMessage({
            type: 'instant',
            object: { type: 'chat', value: message },
        });
    }

    public raiseObject(object: string) {
        this.ws.next({
            type: 'raise',
            object,
        });
    }

    public lowerObject(object: string) {
        this.ws.next({
            type: 'lower',
            object,
        });
    }

    public changePermission(userId: number, elevated: boolean) {
        this.ws.next({
            type: elevated ? 'elevate' : 'recede',
            object: userId,
        });
    }

    private sendMessage(msg: any) {
        this.ws.next(msg);
    }

    private transformUser(key: number, value: IUser) {
        return { id: key, ...value };
    }

    private getCopy<T>(subject: BehaviorSubject<T>): T {
        return JSON.parse(JSON.stringify(subject.getValue())) as T;
    }

    private sortIUser(a: IUser, b: IUser) {
        return a.name.localeCompare(b.name);
    }
}
