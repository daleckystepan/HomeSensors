import { Component, OnInit, OnDestroy } from '@angular/core';

import {Observable} from "rxjs/Rx";
import {AnonymousSubscription} from "rxjs/Subscription";

import { Node } from '../node';
import { NodeService } from '../node.service';


@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, OnDestroy {

  nodes: Node[] = [];
  private timerSubscription: AnonymousSubscription;

  constructor(private nodeService: NodeService) { }

  ngOnInit() {
    this.getNodes();
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
    }
  }

  getNodes(): void {
    this.nodeService.getNodes()
      .subscribe(nodes => {this.nodes = nodes;  this.subscribeToData();});
  }

  private subscribeToData(): void {
    this.timerSubscription = Observable.timer(5000).first().subscribe(() => this.getNodes());
  }

  ping(node: Node): void {
    console.log('ping'+node.node)
  }

  restart(node: Node): void {
    console.log('restart'+node.node)
  }

  fire(node: Node): void {
    console.log('fire'+node.node)
  }

  trash(node: Node): void {
    console.log('trash'+node.node)
  }

}
