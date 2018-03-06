import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { NodesComponent } from './nodes/nodes.component';
import { AppRouterModule } from './app-router.module';
import { SerialComponent } from './serial/serial.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { NodeService } from './node.service';
import { SerialService } from './serial.service';

@NgModule({
  declarations: [
    AppComponent,
    NodesComponent,
    SerialComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRouterModule,
    HttpClientModule
  ],
  providers: [NodeService, SerialService],
  bootstrap: [AppComponent]
})
export class AppModule { }
