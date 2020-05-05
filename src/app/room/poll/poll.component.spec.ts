import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PollComponent } from './poll.component';

describe('PollComponent', () => {
    let component: PollComponent;
    let fixture: ComponentFixture<PollComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PollComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(PollComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
