import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  name = '';
  email = '';
  message = '';

  sendMessage() {
    const subject = encodeURIComponent(`Portfolio enquiry from ${this.name}`);
    const body = encodeURIComponent(`From: ${this.name} <${this.email}>\n\n${this.message}`);
    window.location.href = `mailto:hello@cassini.dev?subject=${subject}&body=${body}`;
  }

}
