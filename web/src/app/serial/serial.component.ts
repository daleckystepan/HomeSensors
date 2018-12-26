import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, interval } from 'rxjs';

import { SerialService } from '../serial.service';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.component.html',
  styleUrls: ['./serial.component.css']
})
export class SerialComponent implements OnInit, OnDestroy {

  text: String[] = []
  private timerInterval: Observable<number>;

  constructor(private serialService: SerialService) { }

  ngOnInit() {
    this.getSerial()
    this.timerInterval = interval(1000);
  }

  public ngOnDestroy(): void {

  }

  getSerial(): void {
    this.serialService.getSerial()
      .subscribe(text => {this.text = text; this.subscribeToData();});
  }

    private subscribeToData(): void {
    this.timerInterval.subscribe(() => this.getSerial());
  }


}
