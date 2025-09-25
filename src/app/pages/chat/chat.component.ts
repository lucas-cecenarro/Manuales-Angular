import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/message';
import { map } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="chat-wrap">
    <div class="chat-header">
      <h2>Chat general</h2>
      <span class="muted" *ngIf="(isLogged$ | async) === false">
        Solo usuarios autenticados pueden enviar mensajes.
      </span>
    </div>

    <div #list class="chat-list">
      <div class="msg" *ngFor="let m of (messages$ | async)">
        <div class="meta">
          <b>{{ m.authorName }}</b> · {{ m.authorRole }}
          <span class="time">
            {{ m.createdAt?.toDate() | date:'short' }}
          </span>
        </div>
        <div class="text">{{ m.text }}</div>
      </div>
    </div>

    <form class="chat-input" (ngSubmit)="onSend()">
      <input
        type="text"
        [(ngModel)]="draft"
        name="draft"
        placeholder="Escribe un mensaje..."
        [disabled]="(isLogged$ | async) === false"
        maxlength="1000"
        required
      />
      <button type="submit"
        [disabled]="(isLogged$ | async) === false || !draft.trim()"
        class="send-btn">Enviar</button>

      <button *ngIf="(isLogged$ | async) === false"
        type="button"
        class="login-btn"
        (click)="goLogin()">
        Iniciar sesión
      </button>
    </form>
  </div>
  `,
  styles: [`
    .chat-wrap { max-width: 720px; margin: 0 auto; padding: 16px; display: grid; gap: 12px; }
    .chat-header { display: flex; justify-content: space-between; align-items: center; }
    .muted { opacity: .7; font-size: .9rem; }
    .chat-list { border: 1px solid #222; border-radius: 12px; padding: 12px; height: 60vh; overflow: auto; background: #0e0e0e; }
    .msg { padding: 10px 12px; border-radius: 10px; background: #141414; margin-bottom: 8px; }
    .meta { font-size: .88rem; opacity: .9; display: flex; gap: 8px; align-items: baseline; }
    .time { margin-left: auto; opacity: .7; font-size: .8rem; }
    .text { margin-top: 4px; line-height: 1.3; white-space: pre-wrap; word-break: break-word; }
    .chat-input { display: flex; gap: 8px; }
    .chat-input input { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid #333; background: #0f0f0f; color: #fff; }
    .send-btn, .login-btn { padding: 10px 14px; border-radius: 10px; border: 1px solid #333; background: #1e1e1e; color: #fff; cursor: pointer; }
    .send-btn:active, .login-btn:active { transform: scale(.98); }
  `]
})
export class ChatComponent {
  private chat = inject(ChatService);
  private router = inject(Router);
  @ViewChild('list') listRef!: ElementRef<HTMLDivElement>;

  messages$ = this.chat.streamMessages();

  isLogged$ = this.chat.authState$.pipe(map(u => !!u));
  draft = '';

  async onSend() {
    const text = this.draft.trim();
    if (!text) return;

    try {
      await this.chat.sendMessage(text);
      this.draft = '';
      // Autoscroll al final
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
