import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RoomPageRoutingModule } from './room-routing.module';

import { RoomPage } from './room.page';
import { ExpandableComponent } from './expandable/expandable.component';
import { PollComponent } from './poll/poll.component';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, RoomPageRoutingModule],
    declarations: [RoomPage, ExpandableComponent, PollComponent],
})
export class RoomPageModule {}
