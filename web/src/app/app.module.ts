import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule}  from '@angular/material';

import { AppComponent } from './app.component';
import { AppRouterModule } from './app-router.module';
import { SerialComponent } from './serial/serial.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { NodeService } from './node.service';
import { TaskService } from './task.service';
import { SerialService } from './serial.service';
import { ProgressService } from './progress.service';

import { TaskComponent } from './task/task.component';
import { NodeComponent } from './node/node.component';

@NgModule({
  declarations: [
    AppComponent,
    SerialComponent,
    DashboardComponent,
    TaskComponent,
    NodeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRouterModule,
    FlexLayoutModule,
    HttpClientModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  providers: [NodeService, TaskService, SerialService, ProgressService],
  bootstrap: [AppComponent]
})
export class AppModule { }
