import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { NavController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class VimeetServerService {
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
    }

    public connect(username: string, room: string) {
        this.ws = webSocket(
            `ws://localhost:8080/ws/${encodeURIComponent(
                room
            )}/${encodeURIComponent(username)}/`
        );

        this.ws.subscribe(
            () => {
                this.isConnected.next(true);
            },
            (error) => {
                console.log(error);
                this.isConnected.next(false);
            }
        );
    }

    public sendInstant(value: string) {
        console.log(`[VimeetServerService.sendInstant] ${value}`);
    }
}
