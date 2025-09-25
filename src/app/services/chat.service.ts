import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore, collection, addDoc, collectionData, doc, getDoc,
  query, orderBy, limitToLast, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { ChatMessage } from '../models/message';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private afs = inject(Firestore);
  private auth = inject(Auth);

  authState$ = authState(this.auth);

  streamMessages(count = 50): Observable<ChatMessage[]> {
    const ref = collection(this.afs, 'messages');
    const q = query(ref, orderBy('createdAt', 'asc'), limitToLast(count));
    return collectionData(q, { idField: 'id' }) as Observable<ChatMessage[]>;
  }

  async sendMessage(text: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('NOT_AUTH');

    const uid = user.uid;

    // Tomamos nombre y rol desde users/{uid}
    const userSnap = await getDoc(doc(this.afs, 'users', uid));
    const profile = userSnap.data() as any | undefined;

    const authorName =
      profile?.displayName ?? profile?.nombre ?? user.displayName ?? 'Usuario';
    const authorRole = profile?.role ?? 'cliente'; // default

    await addDoc(collection(this.afs, 'messages'), {
      text: text.trim(),
      uid,
      authorName,
      authorRole,
      createdAt: serverTimestamp()
    });
  }
}
