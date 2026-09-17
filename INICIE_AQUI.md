# 🚀 SUBLIMIX - Guia de Inicialização

## 1️⃣ Instalar Dependências do Backend

Abra o PowerShell na pasta `backend` e execute:

```powershell
npm install
```

Isso vai instalar todas as dependências necessárias (Express, SQLite3, JWT, bcryptjs, etc).

## 2️⃣ Iniciar o Backend

Na pasta `backend`, execute:

```powershell
npm start
```

Você deve ver uma mensagem como:
```
╔════════════════════════════════════╗
║  🚀 SUBLIMIX BACKEND INICIADO      ║
║  Porta: 3000                       ║
║  URL: http://localhost:3000        ║
║  Banco: SQLite (database.db)       ║
║  Senha Admin: admin123             ║
╚════════════════════════════════════╝
```

## 3️⃣ Abrir o Frontend

Abra `login.html` no navegador, ou use um servidor local:

```powershell
# With Python 3
python -m http.server 8000

# OR With Python 2
python -m SimpleHTTPServer 8000

# OR With Node.js
npx http-server
```

Depois acesse: `http://localhost:8000/login.html`

## 🔐 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| Usuário | `admin` |
| Senha | `admin123` |
| Senha Master | `sublimix2026` |

## 📝 Principais Endpoints de API

Todos começam com: `http://localhost:3000/api`

### Autenticação
- `POST /auth/login` - Fazer login
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/reset-password` - Resetar senha (precisa senha master)
- `GET /auth/verify` - Verificar token

### Exemplo de Login (JavaScript)
```javascript
fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => r.json())
.then(data => console.log(data.token))
```

## 🛠️ Estrutura de Pastas

```
Sublimix 1.0/
├── login.html                 (Tela de login)
├── VERSAO7.html              (Dashboard principal)
├── index.html                (Dashboard - alias)
├── outras versões/           (Versões anteriores)
└── backend/
    ├── server.js             (Servidor principal)
    ├── database.js           (SQLite config)
    ├── package.json          (Dependências)
    ├── .env                  (Configurações)
    ├── routes/
    │   └── auth.js           (Rotas de autenticação)
    └── database.db           (Banco SQLite - criado automaticamente)
```

## ⚠️ Problemas Comuns

### Porta 3000 já em uso
```powershell
# Encontre e mate o processo
Get-Process -Name node | Stop-Process -Force

# OU mude a porta no .env
```

### Erro CORS
Certifique-se que o frontend está acessando `http://localhost:3000/api`

### Banco de dados não criado
Delete `database.db` e reinicie o servidor - ele vai recriar

## 🎯 Próximos Passos

1. ✅ Tela de login criada
2. ✅ Backend configurado
3. ⏳ Integrar dashboard (VERSAO7.html) com autenticação
4. ⏳ Corrigir botões (F8, logout, etc)
5. ⏳ Implementar controle de acesso por perfis

---
**Versão:** 1.0.0  
**Data:** 18 de março de 2026  
**Status:** Sistema em desenvolvimento
