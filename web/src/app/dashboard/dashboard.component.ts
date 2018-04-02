import { Component, OnInit, OnDestroy} from '@angular/core';

import { Observable } from "rxjs/Rx";
import { AnonymousSubscription } from "rxjs/Subscription";

import { Node } from '../node';
import { Task } from '../task';

import { NodeService } from '../node.service';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private timerNodesSubscription: AnonymousSubscription;
  nodes: Node[]

  constructor(private nodeService: NodeService, private taskService: TaskService) {}

  ngOnInit() {
     this.getNodes(true);
  }

  public ngOnDestroy(): void {
    if (this.timerNodesSubscription) {
        this.timerNodesSubscription.unsubscribe();
    }
  }

  getNodes(subscribe: boolean): void {
    this.nodeService.getNodes()
      .subscribe(nodes => {this.nodes = nodes;  if(subscribe) this.subscribeToNodesData();},
                  err => { console.log(err) }
      );
  }

  private subscribeToNodesData(): void {
    this.timerNodesSubscription = Observable.timer(5000).first().subscribe(() => {this.getNodes(true)});
  }


}
