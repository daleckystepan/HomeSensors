import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';

import { Observable, interval } from 'rxjs';

import { Node } from '../node';
import { NodeService } from '../node.service';

import { TaskService } from '../task.service';

import { ProgressService } from '../progress.service';

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.css']
})
export class NodeComponent implements OnInit, OnDestroy {

  private timerInterval: Observable<number>;
  @Input() node: Node;
  @Output() onTaskCreated = new EventEmitter<any>();

  constructor(private nodeService: NodeService, private taskService: TaskService, private progressService: ProgressService) { }

  ngOnInit() {
      //this.getNode();
      this.timerInterval = interval(1000);
  }

  public ngOnDestroy(): void {

  }

  getNode(): void {
    this.nodeService.getNode(this.node)
      .subscribe(node => {this.node = node;  this.subscribeToData();});
  }

  private subscribeToData(): void {
    this.timerInterval.subscribe(() => this.getNode());
  }

  ping(node: Node): void {
    this.progressService.start()
    this.taskService.createTask({id: 0, node: node.id, cmd: "ping", params: []})
      .subscribe(() => {this.onTaskCreated.emit(null); this.progressService.complete()})
  }

  restart(node: Node): void {
    this.taskService.createTask({id: 0, node: node.id, cmd: "restart", params: []})
      .subscribe(() => {this.onTaskCreated.emit(null)})
  }

  fire(node: Node): void {
    this.taskService.createTask({id: 0, node: node.id, cmd: "fire", params: []})
      .subscribe(() => {this.onTaskCreated.emit(null)})
  }

  trash(node: Node): void {
    console.log('trash '+node.id)
  }

}
