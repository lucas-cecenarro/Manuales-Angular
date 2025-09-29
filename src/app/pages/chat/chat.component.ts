import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { map, Observable } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/message';
import { RoleDisplayPipe } from '../../pipes/role-display.pipe'; 

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RoleDisplayPipe],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  private chat = inject(ChatService);
  private router = inject(Router);

  @ViewChild('list') listRef!: ElementRef<HTMLDivElement>;

  messages$: Observable<ChatMessage[]> = this.chat.streamMessages();
  isLogged$ = this.chat.authState$.pipe(map(u => !!u));
  currentUid$ = this.chat.authState$.pipe(map(u => u?.uid ?? null));

  draft = '';

  async onSend() {
    const text = this.draft.trim();
    if (!text) return;

    try {
      await this.chat.sendMessage(text);
      this.draft = '';
      setTimeout(() => {
        const el = this.listRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    } catch (e: any) {
      if (e?.message === 'NOT_AUTH') this.goLogin();
      else console.error(e);
    }
  }

  goLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/chat' } });
  }
}
