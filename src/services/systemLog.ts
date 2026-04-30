type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

const originalConsole: Record<ConsoleMethod, (...data: unknown[]) => void> = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

const noisyPatterns = [
  /user object/i,
  /user uid/i,
  /usu[aá]rio:/i,
  /dados para firestore/i,
  /transa[cç][aã]o processada/i,
  /salvando transa[cç][aã]o no localstorage/i,
  /compara[cç][aã]o/i,
  /debug/i
];

function stamp() {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

function normalize(data: unknown[]) {
  return data
    .map(item => {
      if (item instanceof Error) return item.message;
      if (typeof item === 'string') return item;
      if (typeof item === 'number' || typeof item === 'boolean') return String(item);
      return '[dados ocultos]';
    })
    .join(' ')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[id]');
}

function format(method: ConsoleMethod, message: string) {
  const level = method === 'error' ? 'ERR' : method === 'warn' ? 'WRN' : 'SYS';
  return `[${stamp()}] ${level}> ${message}`;
}

export function bootLog(message: string) {
  originalConsole.log(format('log', message));
}

export function installConsoleHygiene() {
  (['log', 'info', 'warn', 'error'] as ConsoleMethod[]).forEach(method => {
    console[method] = (...data: unknown[]) => {
      const message = normalize(data);
      if (!message || noisyPatterns.some(pattern => pattern.test(message))) return;
      originalConsole[method](format(method, message));
    };
  });

  bootLog('FLETNOTE OS v1.0');
  bootLog('Inicializando interface...');
  bootLog('Conectando ao Firebase...');
  bootLog('Preparando cache local...');
}
