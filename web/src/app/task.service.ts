import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Task } from './task';


import { environment } from '../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};

@Injectable()
export class TaskService {

  private taskSource = new Subject<any>();

  // Observable string streams
  task$ = this.taskSource.asObservable();

  constructor(private http: HttpClient) { }

  createTask(task: Task): Observable<Task> {
    console.log(task)
    return this.http.post<Task>(environment.backendUrl + '/tasks', task, httpOptions)
      .pipe(
        tap(data => this.taskSource.next(null))
      )
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(environment.backendUrl + '/tasks')
  }

  getTask(task: Task): Observable<Task> {
    return this.http.get<Task>(environment.backendUrl + '/task/' + task.id)
  }

}
