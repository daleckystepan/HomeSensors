import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, interval } from 'rxjs';

import { Node } from '../node';
import { NodeService } from '../node.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, OnDestroy {

  constructor(private nodeService: NodeService) { }

  ngOnInit() {

  }

  public ngOnDestroy(): void {

  }

}
