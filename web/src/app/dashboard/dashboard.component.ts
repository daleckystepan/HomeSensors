import { Component, OnInit, OnDestroy} from '@angular/core';

import { Observable, interval } from 'rxjs';

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

  private timerNodesInterval: Observable<number>;
  nodes: Node[]

  constructor(private nodeService: NodeService, private taskService: TaskService) {}

  ngOnInit() {
     this.getNodes(true);
     this.timerNodesInterval = interval(1000);
  }

  public ngOnDestroy(): void {

  }

  getNodes(subscribe: boolean): void {
    this.nodeService.getNodes()
      .subscribe(nodes => {this.nodes = nodes;  if(subscribe) this.subscribeToNodesData();},
                  err => { console.log(err) }
      );
  }

  private subscribeToNodesData(): void {
    this.timerNodesInterval.subscribe(() => {this.getNodes(true)});
  }


}
