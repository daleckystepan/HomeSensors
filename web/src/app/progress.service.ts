import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs';

@Injectable()
export class ProgressService {

  constructor() { }

  private progressSource = new Subject<string>();

  // Observable string streams
  progress$ = this.progressSource.asObservable();

  start() {
    this.progressSource.next("indeterminate");
  }

  complete() {
    this.progressSource.next("determinate");
  }

}
