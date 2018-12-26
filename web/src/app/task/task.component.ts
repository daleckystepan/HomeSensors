import { Component, OnInit, OnDestroy, Input } from '@angular/core';

import { Observable, interval } from 'rxjs';

import { Task } from '../task';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {

  private timerInterval: Observable<number>;
  @Input() task: Task;

  constructor(private taskService: TaskService) { }

  ngOnInit() {
    this.getTask();
    this.timerInterval = interval(5000);
  }

  public ngOnDestroy(): void {

  }

  getTask(): void {
    this.taskService.getTask(this.task)
      .subscribe(task => {this.task = task;  this.subscribeToData();});
  }

  private subscribeToData(): void {
    this.timerInterval.subscribe(() => this.getTask());
  }

}
