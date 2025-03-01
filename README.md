# 🌐 SolveIt - Plataforma Social

![NestJS](https://img.shields.io/badge/NestJS-API-red) ![Docker](https://img.shields.io/badge/Docker-Supported-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-Strongly%20Typed-3178C6) ![ReactNative](https://img.shields.io/badge/React_Native-Mobile_Ready-61DAFB) ![Expo](https://img.shields.io/badge/Expo-Fast_Development-000020)

> Plataforma robusta e escalável chamada **SolveIt**, uma rede social com foco em interação, compartilhamento de conteúdo e soluções colaborativas.

---

## 🚀 Funcionalidades

- ✅ Autenticação com JWT (login, registro, refresh tokens)
- 🧑‍🤝‍🧑 Gerenciamento de usuários
- ✉️ Envio de e-mails com templates
- 📊 Suporte a testes e cobertura
- ⚙️ Estrutura modular com NestJS + MikroORM
- 📝 Gerenciamento de posts
- 💬 Funcionalidades sociais
- 📱 Aplicativo mobile em React Native + Expo

---

## 🛠️ Tecnologias Utilizadas

- Backend:
  - [NestJS](https://nestjs.com/)
  - [MikroORM](https://mikro-orm.io/)
  - PostgreSQL
  - Redis (para cache)
  - Docker + Docker Compose
  - JWT
  - TypeScript
  - Jest
  - Oauth 2.0

- Frontend:
  - [React Native](https://reactnative.dev/)
  - [Expo](https://expo.dev/)
  - [TailwindCSS](https://tailwindcss.com/) via `nativewind`

---

# 📂 Estrutura do Repositório

```
solveit2/
├── solveit2-backend/    → API (NestJS)
└── solveit2-frontend/   → App mobile (React Native + Expo)
```

---

# 🧩 Backend - SolveIt API

## 🐳 Como iniciar com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/lucasrealdev/solveit2.git
cd solveit2/solveit2-backend
```

### 2. Configure seu arquivo `.env`

Crie um `.env` com base no `.env.example` e adicione suas credenciais:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/solveit
JWT_SECRET=suachavesecreta
```

### 3. 🔐 Geração de Chaves JWT (RSA)
Antes de rodar a API, é necessário gerar as chaves **privada** e **pública** para assinatura e verificação de tokens JWT usando RSA.

Execute os comandos abaixo na raiz do backend (`solveit2-backend/`):

```bash
mkdir -p keys

# Chave privada (para assinar tokens)
openssl genrsa -out keys/private.pem 2048

# Chave pública (para verificar tokens)
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 4. Inicie com Docker Compose

```bash
docker-compose up --build
```

> Isso irá subir a API + banco de dados PostgreSQL.

---

## 📦 Scripts importantes do `package.json`

| Script | Descrição |
|--------|-----------|
| `start` | Inicia a aplicação em modo padrão |
| `start:dev` | Inicia a API em modo de desenvolvimento com _watch mode_ |
| `start:prod` | Inicia a aplicação em produção (`dist/main.js`) |
| `test` | Executa todos os testes unitários com Jest |
| `test:cov` | Gera relatório de cobertura de testes |
| `schema:create` | Cria o schema no banco baseado nas entidades |
| `schema:update` | Atualiza o schema conforme as alterações |
| `migrate:create` | Gera um novo arquivo de migração |
| `migrate:up` | Executa as migrações pendentes |
| `migrate:down` | Reverte a última migração executada |

---

## 🧪 Testes

Execute os testes com:

```bash
npm run test
```

Cobertura de testes:

```bash
npm run test:cov
```

---

## 🗃️ Organização do Projeto

```
src/
│
├── auth/         → Autenticação e segurança
├── users/        → Módulo de usuários
├── posts/        → Módulo de publicações
├── mail/         → Serviço de e-mails
├── common/       → Pipes, Guards, Decorators, Utils
├── app.module.ts → Módulo raiz
└── main.ts       → Entry point
```

---

## 📘 Documentação Swagger

A API está documentada utilizando Swagger.

Após iniciar o projeto, acesse a documentação interativa em:

```
http://localhost:3000/api/docs
```

Nela você pode testar endpoints, ver parâmetros, schemas e exemplos em tempo real.

---

# 📱 Frontend - SolveIt App (React Native + Expo)

## ✅ Pré-requisitos

- Node.js (>= 18)
- Expo CLI
- Android Studio (emulador ou celular conectado)

---

## ▶️ Iniciando o Frontend

### 1. Instale as dependências:

```bash
cd solveit2/solveit2-frontend
npm install
```

### 2. Inicie o projeto com Expo

```bash
npx expo start -c
```

> Acesse o app com o Expo Go ou emulador Android/iOS.

---

## 🧬 Tecnologias do Frontend

- React Native
- Expo
- NativeWind (Tailwind para RN)
- Axios

---

## 🤝 Contribuição

Fique à vontade para abrir _issues_, dar sugestões ou contribuir com PRs.

> Em breve, a SolveIt estará pronta para conectar pessoas em busca de soluções reais. 🌎
