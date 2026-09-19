# 📦 GUIA DE DISTRIBUIÇÃO - SUBLIMIX POS 2.0

## 🎯 O que incluir quando enviar para outro computador

Execute `GERAR_INSTALADOR_OFFLINE.bat` e envie apenas `Sublimix-Instalador.exe`. O instalador já leva o Node.js, as dependências e o SQLite.

### ✅ COPIE ESTAS PASTAS E ARQUIVOS:
```
Sublimix 2.0/
├── backend/
│   ├── database.js
│   ├── server.js
│   ├── install.js
│   ├── package.json
│   ├── INICIE_BACKEND.bat
│   ├── routes/
│   │   └── auth.js
│   └── (NÃO inclua: node_modules/ e database.db)
├── index.html
├── login.html
├── script.js
├── style.css
├── INSTALAR.bat          ← Execute isto PRIMEIRO
├── INICIE_AQUI.md
└── INICIE_BACKEND.bat    ← Execute isto para rodar
```

### ❌ NÃO COPIE:
- `node_modules/` (será criado automaticamente)
- `database.db` (será criado na primeira execução)
- `.git/` ou outros arquivos de controle de versão
- Arquivos temporários

---

## 🚀 PASSO A PASSO NO OUTRO COMPUTADOR

### 1️⃣ Pré-requisitos para gerar o instalador
- Node.js instalado no computador de desenvolvimento
- `backend\node_modules` instalado
- NSIS instalado e disponível no PATH

### 2️⃣ Executar a Instalação
1. Execute `Sublimix-Instalador.exe`
2. Clique em **Next** e depois em **Install**
3. Aguarde a criação do banco SQLite

### 3️⃣ Iniciar o Sistema
**Todo dia que quiser usar:**
1. Clique 2x no atalho `Sublimix POS`
2. Abra `login.html` no navegador
3. Use as credenciais padrão (veja em INICIE_AQUI.md)

---

## 🔧 Alternativa: Instalação Manual (se INSTALAR.bat não funcionar)

Abra **PowerShell** na pasta `backend` e execute:

```powershell
# Instalar dependências
npm install

# Rodar o servidor
npm start
```

Depois abra `login.html` no navegador.

---

## ⚠️ Possíveis Problemas

### ❌ "Node.js não encontrado"
**Solução**: gere o instalador com `GERAR_INSTALADOR_OFFLINE.bat`, que inclui `runtime\node.exe`.

### ❌ Porta 3000 já está em uso
**Solução**: Na pasta `backend`, execute:
```powershell
$env:PORT = 3001; npm start
```

### ❌ "database.db not found"
**Solução**: execute o instalador novamente; o banco é criado automaticamente.

### ❌ Erros de conexão no navegador
**Solução**: 
- Certifique-se de que `INICIE_BACKEND.bat` está rodando
- Tente acessar: http://localhost:3000/api/health
- Se mostra JSON, o backend está OK

---

## 📝 Criar uma Distribuição Compactada

Para facilitar, você pode:

### Windows:
1. Abra Explorador de Arquivos
2. Clique direito na pasta `Sublimix 2.0`
3. Selecione "Enviar para" → "Pasta compactada"
4. Renomeie para `Sublimix-Instalador.zip`
5. Envie este arquivo para outra pessoa

### No outro computador:
1. Extraia o `.zip`
2. Execute `INSTALAR.bat`
3. Pronto!

---

## 🎬 Vídeos Úteis (Recomendados)

### Para entender Node.js + SQLite:
- **"Node.js + SQLite Setup"**: https://www.youtube.com/watch?v=U0dKI9oSlCM
- **"Creating a Desktop App with Electron + Node.js"**: https://www.youtube.com/watch?v=OilA64TSAOA (se quiser tornar um .exe)

### Para criar um instalador profissional (.exe):
- **"Criar instalador com NSIS"**: https://www.youtube.com/watch?v=pnRvxvO_6s4
- **"Electron Builder para criar instalador Windows"**: https://www.youtube.com/watch?v=jPV5XO0TmV8

---

## 💡 Próximos Passos (Melhorias Futuras)

Se quiser fazer uma distribuição mais profissional (.exe):

1. **Usar Electron** para criar um app desktop
2. **Usar Electron Builder** para gerar instalador `.exe`
3. **Incluir Node.js** junto no instalador (não precisa do usuário instalar)

Exemplo: Veja `electron-builder` no npm ou video "Electron Builder Windows Installer"

---

## ✅ Resumo Rápido

| Ação | Como Fazer |
|------|-----------|
| **Fazer backup** | Copie a pasta inteira (exceto `node_modules/`) |
| **Enviar para outro PC** | Comprima em `.zip` e envie |
| **Instalar no novo PC** | Execute `INSTALAR.bat` |
| **Rodar diário** | Execute `INICIE_BACKEND.bat` |

---

**Dúvidas? Veja INICIE_AQUI.md ou execute INSTALAR.bat**
