// Cria/atualiza o Admin Master e as categorias iniciais.
// Uso: MASTER_EMAIL=... MASTER_PASSWORD=... npm run db:seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const email = process.env.MASTER_EMAIL?.trim().toLowerCase();
const password = process.env.MASTER_PASSWORD;
const name = process.env.MASTER_NAME ?? 'Admin Master';

if (!email || !password) {
  console.error('Defina MASTER_EMAIL e MASTER_PASSWORD no .env antes de rodar o seed.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('MASTER_PASSWORD precisa ter ao menos 10 caracteres.');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const master = await prisma.user.upsert({
  where: { email },
  update: { role: 'MASTER', active: true },
  create: { email, name, passwordHash, role: 'MASTER' },
});
console.log(`Admin Master pronto: ${master.email}`);

const categories = ['Produtividade', 'Ferramentas de desenvolvimento', 'Utilitários', 'Comunicação', 'Segurança', 'Sistemas internos'];
for (const c of categories) {
  const slug = c
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  await prisma.category.upsert({ where: { slug }, update: {}, create: { name: c, slug } });
}
console.log(`${categories.length} categorias garantidas.`);

await prisma.$disconnect();
