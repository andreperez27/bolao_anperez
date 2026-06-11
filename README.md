# Bolão da Copa 2026 — PWA

Sistema de bolão para a Copa do Mundo 2026 com React + Vite + Supabase.

## Estrutura do Projeto

```
├── index.html                     # Entry point Vite
├── package.json                   # Dependências
├── vite.config.js                 # Configuração Vite + PWA
├── public/
│   ├── manifest.json              # Manifest PWA
│   └── icons/                     # Ícones PWA (192x192, 512x512)
├── sql/
│   ├── 001_create_tables.sql      # Criação das tabelas
│   ├── 002_rls_policies.sql       # Políticas de segurança RLS
│   └── 003_create_admin.sql       # Instruções para criar admin
├── scripts/
│   └── generate-icons.js          # Script para gerar ícones PWA
└── src/
    ├── main.jsx                   # Entry point React
    ├── App.jsx                    # Componente raiz com rotas
    ├── styles/
    │   ├── global.css             # Estilos globais
    │   └── theme.js               # Paleta de cores
    ├── services/
    │   ├── supabase.js            # Cliente Supabase
    │   ├── auth.js                # Autenticação (SignUp, SignIn, etc.)
    │   ├── jogadores.js           # CRUD jogadores
    │   ├── cartelas.js            # CRUD cartelas
    │   ├── admin.js               # Admin/Resultados/Config
    │   └── jogos.js               # Dados dos jogos da Copa
    ├── utils/
    │   ├── pontuacao.js           # Cálculo de pontos
    │   └── datas.js               # Utilitários de data
    ├── contexts/
    │   └── AuthContext.jsx         # Contexto de autenticação
    ├── hooks/
    │   ├── useCartelas.js         # Hook de gerenciamento de cartelas
    │   └── useRanking.js          # Hook de dados do ranking
    ├── components/
    │   ├── Card.jsx               # Componente Card reutilizável
    │   ├── Btn.jsx                # Botão padrão
    │   ├── Flag.jsx               # Bandeira do país
    │   ├── StatusBadge.jsx        # Badge de status (Válida/Aguardando/Rejeitada)
    │   ├── PainelFinanceiro.jsx   # Painel de premiação
    │   ├── JogoCard.jsx           # Card de jogo com placar
    │   ├── ModalInstrucoes.jsx    # Modal de regras
    │   ├── AdminPanel.jsx         # Painel administrativo
    │   ├── PrintArea.jsx          # Área de impressão PDF
    │   └── OfflineBanner.jsx      # Banner de modo offline
    └── pages/
        ├── Login.jsx              # Tela de login/cadastro
        ├── MinhasCartelas.jsx     # Lista de cartelas do jogador
        ├── PreencherCartela.jsx   # Preenchimento de palpites
        └── Ranking.jsx            # Ranking e área admin
```

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL na ordem:
   - `sql/001_create_tables.sql` — Cria as tabelas
   - `sql/002_rls_policies.sql` — Ativa RLS e cria políticas
3. Configure a autenticação:
   - Em Authentication > Settings, habilite "Email" como provider
   - (Opcional) Desabilite "Confirm email" se quiser cadastro imediato
4. Crie um administrador:
   - Siga as instruções em `sql/003_create_admin.sql`
5. Verifique se as credenciais em `src/services/supabase.js` estão corretas:
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY` (já configuradas)

## Deploy como PWA

### Opção 1: Vercel

```bash
npm i -g vercel
vercel --prod
```

### Opção 2: Netlify

```bash
npm run build
# Faça upload da pasta dist/ para Netlify
```

### Opção 3: GitHub Pages

```bash
npm run build
# Configure GitHub Pages para apontar para dist/
```

## Funcionalidades

### Jogadores
- Cadastro e login via email + senha (Supabase Auth)
- Recuperação de senha por email
- Múltiplas cartelas por jogador
- Exclusão de conta

### Cartelas
- Preenchimento de palpites para todos os jogos da Copa
- Palpite do campeão com pontuação progressiva:
  - Grupos: 20 pts | Oitavas: 15 pts | Quartas: 10 pts | Semi: 5 pts | Final: 2 pts
- Bloqueio automático por data do jogo
- PDF via impressão (Ctrl+P)
- Status: Aguardando → Validada/Rejeitada

### Pontuação
- Placar Exato: 5 pts
- Diferença Certa: 4 pts
- Vencedor/Empate: 3 pts
- Erro: 0 pts

### Administração
- Validação de cartelas (aprovar/rejeitar)
- Inserção manual de resultados
- Busca automática de resultados via API
- Definição do campeão real
- Lista de participantes cadastrados
- Configuração de valor da aposta

### PWA
- Instalável em Android, iOS e Windows
- Funciona offline (cache de assets)
- Banner de modo offline

## Segurança

- **Supabase Auth**: senhas gerenciadas pelo Supabase, nunca armazenadas na aplicação
- **RLS**: todas as tabelas protegidas por Row Level Security
- **Admin**: apenas emails cadastrados na tabela `admins` têm acesso administrativo
- **Isolamento**: cada jogador vê apenas suas próprias cartelas

## Checklist de Validação

- [ ] npm run build — sem erros
- [ ] Login com email/senha funcional
- [ ] Cadastro de novo usuário funcional
- [ ] Criação de cartela funcional
- [ ] Palpites e campeão salvos corretamente
- [ ] Ranking calcula pontos corretamente
- [ ] Admin consegue validar cartelas
- [ ] Admin consegue inserir resultados
- [ ] PWA instalável no navegador
- [ ] Modo offline exibe banner
- [ ] RLS impede acesso não autorizado (testar via Supabase dashboard)
