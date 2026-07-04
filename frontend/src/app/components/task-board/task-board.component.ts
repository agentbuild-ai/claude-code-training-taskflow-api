import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { TasksService } from '../../services/tasks.service';
import { UsersService } from '../../services/users.service';
import { Task, TaskPriority, TaskStatus } from '../../models/task';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
];

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

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
  readonly priorities = PRIORITIES;

  readonly title = signal('');
  readonly projectId = signal<number | null>(null);
  readonly assigneeId = signal<number | null>(null);
  readonly priority = signal<TaskPriority>('medium');
  readonly dueDate = signal<string>('');

  readonly filterPriority = signal<TaskPriority | ''>('');
  readonly filterOverdue = signal(false);
  readonly filterTag = signal('');

  readonly newTagInput: Record<number, string> = {};

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
      priority: this.priority(),
      due_date: this.dueDate() || undefined,
    });
    this.title.set('');
    this.projectId.set(null);
    this.assigneeId.set(null);
    this.priority.set('medium');
    this.dueDate.set('');
  }

  applyFilters() {
    this.tasksService.load({
      priority: this.filterPriority() || undefined,
      overdue: this.filterOverdue() || undefined,
      tag: this.filterTag().trim() || undefined,
    });
  }

  addTagFor(taskId: number) {
    const tag = (this.newTagInput[taskId] ?? '').trim();
    if (!tag) return;
    this.tasksService.addTag(taskId, tag);
    this.newTagInput[taskId] = '';
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

  dueDateLabel(task: Task): string | null {
    if (!task.due_date) return null;
    const d = new Date(task.due_date);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
  }

  isOverdue(task: Task): boolean {
    if (!task.due_date || task.status === 'done') return false;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return false;
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }
}
