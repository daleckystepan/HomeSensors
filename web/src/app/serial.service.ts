import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class SerialService {
  private url = 'http://localhost:8080/serial';

  constructor(private http: HttpClient) { }

  getSerial(): Observable<String[]> {
    return this.http.get<String[]>(this.url)
  }

}
