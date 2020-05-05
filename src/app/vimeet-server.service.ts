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

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
    public messages: BehaviorSubject<IMessage>;
    public users: BehaviorSubject<IUser[]>;
    public objects: BehaviorSubject<IObject[]>;
    public instant: BehaviorSubject<IMessage>;
    public chatMessage: BehaviorSubject<IChatMessage>;
    public selfId: number;

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
    }

    public connect(username: string, room: string) {
        this.ws = webSocket(
            `${environment.vimeet_server_websocket_protocol}://${
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
