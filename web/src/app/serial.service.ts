import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../environments/environment';

@Injectable()
export class SerialService {

  constructor(private http: HttpClient) { }

  getSerial(): Observable<String[]> {
    return this.http.get<String[]>(environment.backendUrl + "/serial")
  }

}
