import type { TerminalMessage } from '../types';

const responses: Record<string, string> = {
  'hello': 'Hello! How can I assist your business vision today?',
  'help': 'I can answer questions about our services, process, and insights. Try asking about strategy, transformation, or our workflow.',
  'services': 'VVG ONLINE offers: Strategy & Innovation, Digital Transformation, Capability Building, Strategic Marketing, Design Thinking, and IT Management.',
  'strategy': 'Our Strategy & Innovation service develops tailored roadmaps aligned with your business goals.',
  'workflow': 'Our event-driven workflow follows: TRIGGER → PROCESS → EXECUTE → OUTPUT, creating continuous evolution loops.',
  'contact': 'Use the contact form on our page or reach out via LinkedIn. We typically respond within 24 hours.',
};

const template = document.createElement('template');
template.innerHTML = `
  <div id="ai-terminal" class="terminal-closed" role="dialog" aria-label="AI Assistant Terminal">
    <div class="terminal-header" role="button" tabindex="0">
      <span class="terminal-title">
        <i class="bi bi-robot me-2 text-dark bg-light w-75 p-1"></i>AI_AGENT_V0.109
      </span>
      <span class="terminal-controls">
        <span class="control-dot" aria-hidden="true"></span>
        <span class="control-dot" aria-hidden="true"></span>
      </span>
    </div>
    <div class="terminal-body">
      <div id="chat-output" class="chat-output" aria-live="polite">
        <div class="system-msg">// SECURE CONNECTION ESTABLISHED...</div>
        <div class="system-msg">// AGENT READY. HOW CAN I ASSIST YOUR VISION?</div>
      </div>
      <div class="terminal-input-area">
        <span class="terminal-prompt">&gt;</span>
        <input type="text" id="user-input" placeholder="Type command..." autocomplete="off" aria-label="AI terminal input">
      </div>
    </div>
  </div>
`;

class AITerminal extends HTMLElement {
  private messages: TerminalMessage[] = [
    { type: 'system', content: '// SECURE CONNECTION ESTABLISHED...' },
    { type: 'system', content: '// AGENT READY. HOW CAN I ASSIST YOUR VISION?' },
  ];

  connectedCallback(): void {
    this.append(template.content.cloneNode(true));
    this.initEventListeners();
  }

  initEventListeners(): void {
    this.querySelector('.terminal-header')?.addEventListener('click', () => this.toggle());
    const input = this.querySelector('#user-input') as HTMLInputElement;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleInput();
    });
  }

  toggle(): void {
    this.querySelector('#ai-terminal')?.classList.toggle('terminal-closed');
  }

  handleInput(): void {
    const input = this.querySelector('#user-input') as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;

    this.addMessage('user', text);
    input.value = '';

    const reply = this.generateReply(text.toLowerCase());
    setTimeout(() => this.addMessage('ai', reply), 400 + Math.random() * 600);
  }

  generateReply(input: string): string {
    for (const [key, response] of Object.entries(responses)) {
      if (input.includes(key)) return response;
    }
    return `I understand you're asking about "${input}". For specific inquiries, please reach out through our contact form or ask about: services, strategy, workflow, or contact.`;
  }

  addMessage(type: TerminalMessage['type'], content: string): void {
    this.messages.push({ type, content });
    const output = this.querySelector('#chat-output') as HTMLElement;
    const msg = document.createElement('div');
    msg.className = `${type}-msg`;
    msg.textContent = type === 'user' ? `> ${content}` : content;
    output.appendChild(msg);
    output.scrollTop = output.scrollHeight;
  }
}

customElements.define('ai-terminal', AITerminal);
