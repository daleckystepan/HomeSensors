import { Component, OnInit, OnDestroy} from '@angular/core';

import { Observable } from "rxjs/Rx";
import { AnonymousSubscription } from "rxjs/Subscription";

import { Task } from './task';
import { TaskService } from './task.service';

import { ProgressService } from './progress.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Home Sensors';
  mode = "determinate"

  private timerTasksSubscription: AnonymousSubscription;
  tasks: Task[];

  constructor(private taskService: TaskService, private  progressService: ProgressService) {
    progressService.progress$.subscribe(
      mode => {
        this.mode = mode
      });

    taskService.task$.subscribe(
      mode => {
        this.getTasks(false)
      });
  }

  ngOnInit() {
       this.getTasks(true);
  }

  public ngOnDestroy(): void {
      if (this.timerTasksSubscription) {
        this.timerTasksSubscription.unsubscribe();
    }
  }

  getTasks(subscribe: boolean): void {
    this.taskService.getTasks()
      .subscribe(tasks => {this.tasks = tasks; if(subscribe) this.subscribeToTasksData();});
  }

  private subscribeToTasksData(): void {
    this.timerTasksSubscription = Observable.timer(5000).first().subscribe(() => {this.getTasks(true)});
  }

}
