import { PrismaClient } from '@prisma/client';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../src/auth/password';

const prisma = new PrismaClient();

async function main() {
  const action = process.argv[2];
  if (action === 'set-password') return setPassword();
  if (action === 'create') return createUser();
  throw new Error('Usa set-password o create.');
}

async function setPassword() {
  const email = normalizeEmail(process.argv[3] ?? await promptText('Email: '));
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (!user) throw new Error('No existe un usuario con ese email.');

  const passwordHash = await requestPassword();
  await prisma.user.update({ where: { id: user.id }, data: { email, passwordHash, active: true } });
  stdout.write('Contraseña actualizada de forma segura.\n');
}

async function createUser() {
  const name = (await promptText('Nombre: ')).trim();
  const email = normalizeEmail(await promptText('Email: '));
  if (!name) throw new Error('El nombre es obligatorio.');

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) throw new Error('Ya existe un usuario con ese email.');

  const passwordHash = await requestPassword();
  await prisma.user.create({ data: { name, email, passwordHash, role: 'MEMBER', active: true } });
  stdout.write('Usuario MEMBER creado.\n');
}

async function requestPassword() {
  const password = await promptHidden('Contraseña (mínimo 12 caracteres): ');
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  const confirmation = await promptHidden('Confirmar contraseña: ');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  return hashPassword(password);
}

async function promptText(label: string) {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return await readline.question(label);
  } finally {
    readline.close();
  }
}

function promptHidden(label: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('La contraseña debe establecerse desde una terminal interactiva.');
  }

  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          finish();
          reject(new Error('Operación cancelada.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    stdin.on('data', onData);
  });
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido.');
  return email;
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Error inesperado.';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
