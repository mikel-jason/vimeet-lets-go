import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

export interface IMessage {
    type: string;
    owner_id: number;
    owner_name: string;
    object: string;
}

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
    public messages: BehaviorSubject<IMessage>;
    private ws: WebSocketSubject<unknown>;
    private isConnected: BehaviorSubject<boolean>;
    private knownTypes = ['all', 'instant'];

    constructor(private navCtl: NavController) {
        this.isConnected = new BehaviorSubject<boolean>(false);
        this.isConnected.subscribe((connected) => {
            if (connected) {
                this.navCtl.navigateForward('/room');
            } else {
                this.navCtl.navigateBack('/join');
            }
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
                this.isConnected.next(true);
                if (this.knownTypes.some((elem) => elem === msg.type)) {
                    if (!this.messages) {
                        this.messages = new BehaviorSubject<IMessage>(msg);
                    } else {
                        this.messages.next(msg);
                    }
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
}
