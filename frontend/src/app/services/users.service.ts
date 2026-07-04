import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { CreateUserBody, User } from '../models/user';
import { API_BASE_URL } from './api-config';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/users`;

  readonly users = signal<User[]>([]);
  readonly error = signal<string | null>(null);

  load() {
    this.http.get<User[]>(this.baseUrl).pipe(
      tap((users) => this.users.set(users)),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  create(body: CreateUserBody) {
    this.http.post<User>(this.baseUrl, body).pipe(
      tap((user) => this.users.update((users) => [user, ...users])),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  remove(id: number) {
    this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.users.update((users) => users.filter((u) => u.id !== id))),
      catchError((err) => this.handleError(err)),
    ).subscribe();
  }

  private handleError(err: HttpErrorResponse) {
    this.error.set(err.error?.error ?? 'Something went wrong');
    return of(null);
  }
}
