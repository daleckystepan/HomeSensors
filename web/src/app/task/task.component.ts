import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { Observable } from "rxjs/Rx";
import { AnonymousSubscription } from "rxjs/Subscription";

import { Task } from '../task';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {

  private timerSubscription: AnonymousSubscription;
  @Input() task: Task;

  constructor(private taskService: TaskService) { }

  ngOnInit() {
    this.getTask();
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
    }
  }

  getTask(): void {
    this.taskService.getTask(this.task)
      .subscribe(task => {this.task = task;  this.subscribeToData();});
  }

  private subscribeToData(): void {
    this.timerSubscription = Observable.timer(5000).first().subscribe(() => this.getTask());
  }

}
