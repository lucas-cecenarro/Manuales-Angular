import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { FacturaComponent } from './pages/factura/factura.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { ChatComponent } from './pages/chat/chat.component';
import { ReportesComponent } from './pages/reportes/reportes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'contacto', component: ContactoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'factura', component: FacturaComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: '**', redirectTo: '' }
];
