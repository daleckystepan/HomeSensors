import { Component, OnInit, OnDestroy, VERSION } from '@angular/core';

import { Observable, interval } from 'rxjs';

import { Task } from './task';
import { TaskService } from './task.service';

import { ProgressService } from './progress.service';

import { MatSnackBar } from "@angular/material";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Home Sensors';
  mode = "determinate"
  version = VERSION.full

  private timerTasksInterval: Observable<number>;
  tasks: Task[];

  constructor(private taskService: TaskService, private  progressService: ProgressService, public snackBar: MatSnackBar) {
    progressService.progress$.subscribe(
      mode => {
        this.mode = mode
      });

    taskService.task$.subscribe(
      mode => {
        this.getTasks(false)
        this.openSnackBar()
      });
  }

  ngOnInit() {
       this.getTasks(true);
       this.timerTasksInterval = interval(5000);
  }

  public ngOnDestroy(): void {

  }

  getTasks(subscribe: boolean): void {
    this.taskService.getTasks()
      .subscribe(tasks => {this.tasks = tasks; if(subscribe) this.subscribeToTasksData();});
  }

  private subscribeToTasksData(): void {
    this.timerTasksInterval.subscribe(() => {this.getTasks(true)});
  }

  openSnackBar() {
    this.snackBar.open('Task created', 'Undo', {
      duration: 1500,
    });
  }

}
