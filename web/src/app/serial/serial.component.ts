import { Component, OnInit, OnDestroy } from '@angular/core';

import {Observable} from "rxjs/Rx";
import {AnonymousSubscription} from "rxjs/Subscription";

import { SerialService } from '../serial.service';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.component.html',
  styleUrls: ['./serial.component.css']
})
export class SerialComponent implements OnInit, OnDestroy {

  text: String[] = []
  private timerSubscription: AnonymousSubscription;

  constructor(private serialService: SerialService) { }

  ngOnInit() {
    this.getSerial()
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
    }
  }

  getSerial(): void {
    this.serialService.getSerial()
      .subscribe(text => {this.text = text; this.subscribeToData();});
  }

    private subscribeToData(): void {
    this.timerSubscription = Observable.timer(1000).first().subscribe(() => this.getSerial());
  }


}
