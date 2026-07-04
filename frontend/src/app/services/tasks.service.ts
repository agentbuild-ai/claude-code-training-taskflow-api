import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { CreateTaskBody, Task, TaskFilters, TaskPriority, TaskStatus } from '../models/task';
import { API_BASE_URL } from './api-config';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/tasks`;

  readonly tasks = signal<Task[]>([]);
  readonly error = signal<string | null>(null);

  load(filters: TaskFilters = {}) {
    let params = new HttpParams();
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.overdue) params = params.set('overdue', 'true');
    if (filters.due_before) params = params.set('due_before', filters.due_before);
    if (filters.tag) params = params.set('tag', filters.tag);

    this.http.get<Task[]>(this.baseUrl, { params }).pipe(
      tap((tasks) => this.tasks.set(tasks)),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  create(body: CreateTaskBody) {
    this.http.post<Task>(this.baseUrl, body).pipe(
      tap((task) => this.tasks.update((tasks) => [task, ...tasks])),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  updateStatus(id: number, status: TaskStatus) {
    this.http.patch<Task>(`${this.baseUrl}/${id}`, { status }).pipe(
      tap((updated) => this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  updatePriority(id: number, priority: TaskPriority) {
    this.http.patch<Task>(`${this.baseUrl}/${id}`, { priority }).pipe(
      tap((updated) => this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  addTag(id: number, tag: string) {
    this.http.post<Task>(`${this.baseUrl}/${id}/tags`, { tag }).pipe(
      tap((updated) => this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  removeTag(id: number, tag: string) {
    this.http.delete<Task>(`${this.baseUrl}/${id}/tags/${encodeURIComponent(tag)}`).pipe(
      tap((updated) => this.tasks.update((tasks) => tasks.map((t) => (t.id === id ? updated : t)))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  remove(id: number) {
    this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.tasks.update((tasks) => tasks.filter((t) => t.id !== id))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  private handleError(err: HttpErrorResponse) {
    this.error.set(err.error?.error ?? 'Something went wrong');
    return of(null);
  }
}
