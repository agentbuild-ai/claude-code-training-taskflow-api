import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { Task, TaskStatus } from '../../models/task';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
];

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './task-board.component.html',
})
export class TaskBoardComponent implements OnInit {
  readonly tasksService = inject(TasksService);
  readonly projectsService = inject(ProjectsService);
  readonly usersService = inject(UsersService);

  readonly columns = COLUMNS;
  readonly statuses: TaskStatus[] = COLUMNS.map((c) => c.status);

  readonly title = signal('');
  readonly projectId = signal<number | null>(null);
  readonly assigneeId = signal<number | null>(null);

  readonly projectNameById = computed(() => {
    const map = new Map<number, string>();
    for (const project of this.projectsService.projects()) map.set(project.id, project.name);
    return map;
  });

  readonly assigneeNameById = computed(() => {
    const map = new Map<number, string>();
    for (const user of this.usersService.users()) map.set(user.id, user.name);
    return map;
  });

  ngOnInit() {
    this.tasksService.load();
    this.projectsService.load();
    this.usersService.load();
  }

  tasksFor(status: TaskStatus): Task[] {
    return this.tasksService.tasks().filter((t) => t.status === status);
  }

  submit() {
    if (!this.title().trim() || !this.projectId()) return;
    this.tasksService.create({
      title: this.title().trim(),
      project_id: this.projectId()!,
      assignee_id: this.assigneeId() ?? undefined,
    });
    this.title.set('');
    this.projectId.set(null);
    this.assigneeId.set(null);
  }

  projectName(id: number): string {
    return this.projectNameById().get(id) ?? `Project #${id}`;
  }

  assigneeName(id: number | null): string | null {
    return id === null ? null : (this.assigneeNameById().get(id) ?? `User #${id}`);
  }

  columnLabel(status: TaskStatus): string {
    return this.columns.find((c) => c.status === status)?.label ?? status;
  }
}
