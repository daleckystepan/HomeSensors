import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Node } from './node';
import { Task } from './task';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json'
  })
};


@Injectable()
export class NodeService {
  private url = 'http://localhost:8080/v1/nodes';

  constructor(private http: HttpClient) { }

  getNodes(): Observable<Node[]> {
    return this.http.get<Node[]>(this.url)
  }

  createTask(task: Task): Observable<Task> {
    console.log(task)
    return this.http.post<Task>('http://localhost:8080/v1/tasks', task, httpOptions)
  }

}
