import {
    Component,
    AfterViewInit,
    Input,
    ViewChild,
    ElementRef,
    Renderer2,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

@Component({
    selector: 'app-expandable',
    templateUrl: './expandable.component.html',
    styleUrls: ['./expandable.component.scss'],
})
export class ExpandableComponent implements AfterViewInit, OnChanges {
    @ViewChild('expandWrapper', { read: ElementRef, static: true })
    expandWrapper: ElementRef;
    @Input() expanded = false;
    @Input() expandHeight: number;

    constructor(public renderer: Renderer2) {}
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.expandHeight) {
            this.changeHeight(changes.expandHeight.currentValue);
        }
    }

    ngAfterViewInit() {
        this.changeHeight(this.expandHeight);
    }

    changeHeight(height: number) {
        this.renderer.setStyle(
            this.expandWrapper.nativeElement,
            'height',
            `${height}px`
        );
    }
}
