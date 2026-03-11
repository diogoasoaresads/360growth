#!/bin/sh
# migrate-prod.sh
# Aplica todas as migrações pendentes no banco de produção.
# Executar no terminal do EasyPanel (App → Terminal):
#   sh scripts/migrate-prod.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       360growth — Migração de Produção           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo "▶ Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não está definida. Abortando."
  exit 1
fi
echo "  ✓ DATABASE_URL detectada"

echo ""
echo "▶ Aplicando schema ao banco (drizzle-kit push)..."
echo "  (Serão criadas tabelas e colunas faltantes. Dados existentes não são apagados.)"
echo ""

npx drizzle-kit push --force

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Migração concluída com sucesso!              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Próximo passo — popular dados de teste:"
echo "  npx tsx src/lib/db/seed-demo-test.ts"
echo ""
