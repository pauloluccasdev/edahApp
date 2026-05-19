/**
 * Seed de desenvolvimento — cria usuário de suporte padrão.
 * Uso: pnpm --filter api prisma:seed
 *
 * Credenciais geradas:
 *   email: suporte@edah.dev
 *   senha: Suporte@123
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Carrega .env.local manualmente (sem dependência de dotenv)
try {
  const envPath = resolve(__dirname, '../.env.local');
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] ??= match[2].trim();
    });
} catch {
  // em produção/CI as vars já estão no ambiente
}

const SEED_EMAIL = 'suporte@edah.dev';
const SEED_PASSWORD = 'Suporte@123';
const SEED_NAME = 'Suporte Dev';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // 1. Church placeholder para o usuário de suporte
  const church = await prisma.church.upsert({
    where: { slug: 'suporte-dev' },
    update: {},
    create: {
      name: 'Suporte Dev',
      slug: 'suporte-dev',
      timezone: 'America/Sao_Paulo',
    },
  });
  console.log(`✅ Church: ${church.name} (${church.id})`);

  // 2. Criar usuário no Supabase Auth (ignora se já existe)
  let supabaseId: string;

  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === SEED_EMAIL);

  if (existing) {
    supabaseId = existing.id;
    console.log(`ℹ️  Auth: usuário já existe no Supabase (${supabaseId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Erro ao criar usuário no Supabase Auth: ${error?.message}`);
    }

    supabaseId = data.user.id;
    console.log(`✅ Auth: usuário criado no Supabase (${supabaseId})`);
  }

  // 3. Criar/atualizar usuário no banco
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { supabaseId, isSuporte: true },
    create: {
      churchId: church.id,
      name: SEED_NAME,
      email: SEED_EMAIL,
      supabaseId,
      isSuporte: true,
    },
  });
  console.log(`✅ User: ${user.name} <${user.email}> (isSuporte: ${user.isSuporte})`);

  console.log('\n─────────────────────────────────');
  console.log('🔑 Credenciais de suporte:');
  console.log(`   Email : ${SEED_EMAIL}`);
  console.log(`   Senha : ${SEED_PASSWORD}`);
  console.log('─────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
