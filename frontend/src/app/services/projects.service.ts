import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { CreateProjectBody, Project } from '../models/project';
import { API_BASE_URL } from './api-config';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/projects`;

  readonly projects = signal<Project[]>([]);
  readonly error = signal<string | null>(null);

  load() {
    this.http.get<Project[]>(this.baseUrl).pipe(
      tap((projects) => this.projects.set(projects)),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  create(body: CreateProjectBody) {
    this.http.post<Project>(this.baseUrl, body).pipe(
      tap((project) => this.projects.update((projects) => [project, ...projects])),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  remove(id: number) {
    this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.projects.update((projects) => projects.filter((p) => p.id !== id))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  private handleError(err: HttpErrorResponse) {
    this.error.set(err.error?.error ?? 'Something went wrong');
    return of(null);
  }
}
