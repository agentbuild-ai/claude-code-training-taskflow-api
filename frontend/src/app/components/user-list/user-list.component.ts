import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  readonly usersService = inject(UsersService);

  readonly name = signal('');
  readonly email = signal('');

  ngOnInit() {
    this.usersService.load();
  }

  submit() {
    if (!this.name().trim() || !this.email().trim()) return;
    this.usersService.create({ name: this.name().trim(), email: this.email().trim() });
    this.name.set('');
    this.email.set('');
  }
}
