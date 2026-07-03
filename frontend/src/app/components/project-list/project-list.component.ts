import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent implements OnInit {
  readonly projectsService = inject(ProjectsService);
  readonly usersService = inject(UsersService);

  readonly name = signal('');
  readonly ownerId = signal<number | null>(null);

  readonly ownerNameById = computed(() => {
    const map = new Map<number, string>();
    for (const user of this.usersService.users()) map.set(user.id, user.name);
    return map;
  });

  ngOnInit() {
    this.projectsService.load();
    this.usersService.load();
  }

  submit() {
    if (!this.name().trim() || !this.ownerId()) return;
    this.projectsService.create({ name: this.name().trim(), owner_id: this.ownerId()! });
    this.name.set('');
    this.ownerId.set(null);
  }

  ownerName(id: number): string {
    return this.ownerNameById().get(id) ?? `User #${id}`;
  }
}
