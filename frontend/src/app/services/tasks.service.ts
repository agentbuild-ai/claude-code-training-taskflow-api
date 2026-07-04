import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { CreateTaskBody, Task, TaskStatus } from '../models/task';
import { API_BASE_URL } from './api-config';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/tasks`;

  readonly tasks = signal<Task[]>([]);
  readonly error = signal<string | null>(null);

  load() {
    this.http.get<Task[]>(this.baseUrl).pipe(
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
