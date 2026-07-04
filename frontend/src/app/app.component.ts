import { Component } from '@angular/core';
import { UserListComponent } from './components/user-list/user-list.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { TaskBoardComponent } from './components/task-board/task-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserListComponent, ProjectListComponent, TaskBoardComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
