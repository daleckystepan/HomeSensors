import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable } from "rxjs/Rx";
import { AnonymousSubscription } from "rxjs/Subscription";

import { Node } from '../node';
import { NodeService } from '../node.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, OnDestroy {

  private timerSubscription: AnonymousSubscription;


  constructor(private nodeService: NodeService) { }

  ngOnInit() {

  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
    }
  }

//   private subscribeToData(): void {
//     this.timerSubscription = Observable.timer(5000).first().subscribe(() => this.getNodes());
//   }


}
