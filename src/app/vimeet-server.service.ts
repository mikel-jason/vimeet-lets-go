import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

export interface IMessage {
    type?: string;
    owner_id?: number;
    owner_name?: string;
    object?: string | object;
    joined?: any[];
    raised?: any[];
}

interface IUser {
    name: string;
    elevated: boolean;
    id: number;
}

interface IUserInput {
    [key: number]: IUser;
}

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
    public messages: BehaviorSubject<IMessage>;
    public users: BehaviorSubject<IUser[]>;
    public objects: BehaviorSubject<IMessage[]>;
    public instant: BehaviorSubject<IMessage>;

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
    }

    public connect(username: string, room: string) {
        this.ws = webSocket(
            `${environment.vimeet_server_websocket_protocol}://${
                environment.vimeet_server_base_uri
            }/ws/${encodeURIComponent(room)}/${encodeURIComponent(username)}/`
        );

        this.ws.subscribe(
            (msg: IMessage) => {
                this.isConnected.next(true);
                switch (msg.type) {
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
                        if (msg.object) {
                            this.instant.next(msg);
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
            instantobject: value,
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
