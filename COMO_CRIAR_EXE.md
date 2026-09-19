# 🎯 CRIAR INSTALADOR .EXE - PASSO A PASSO

## 📥 Pré-requisitos (instalar uma única vez)

### 1. Instalar NSIS
1. Acesse: **https://nsis.sourceforge.io/**
2. Clique em "Download" (versão mais recente)
3. Execute o instalador
4. **IMPORTANTE**: Na instalação, selecione a opção "Add NSIS to PATH"
5. Reinicie o Windows

### 2. Verificar instalação
Abra PowerShell e execute:
```powershell
makensis /version
```
Se mostrar a versão, está OK! ✅

---

## 🛠️ Criar o Instalador .exe

### Opção 1: Automático offline (MAIS FÁCIL)
1. Abra a pasta `Sublimix 2.0`
2. Confirme que `backend\node_modules` já existe
3. Clique 2x em **`GERAR_INSTALADOR_OFFLINE.bat`**
4. Aguarde...
5. Arquivo `Sublimix-Instalador.exe` será criado! 🎉

### Opção 2: Manual via PowerShell
```powershell
cd "C:\Sublimix 2.0"
makensis.exe "instalador.nsi"
```

---

## 📦 O que está incluído no `.exe` offline?

O instalador faz **TUDO automaticamente**:

✅ Node.js portátil (`runtime\node.exe`)  
✅ Todos os arquivos e dependências (`backend\node_modules`)  
✅ Cria o banco SQLite durante a instalação  
✅ Cria atalhos no Desktop  
✅ Cria entrada no Menu Iniciar  

> O MySQL não está incluído. `mysql2` é apenas o cliente Node.js; um servidor MySQL exigiria uma distribuição separada e configuração de serviço. O SQLite é o banco padrão e funciona offline.

---

## 🚀 Como usar o instalador

**No seu computador ou em outro:**

1. Execute `Sublimix-Instalador.exe`
2. Clique "Next" → "Install"
3. Aguarde terminar
4. Pronto! ✅

**Para usar diariamente:**
- Clique no atalho "Sublimix POS" no Desktop
- OU procure no Menu Iniciar

---

## 📝 Personalizar o Instalador

Se quiser mudar o ícone, cor ou texto:

Abra `instalador.nsi` em um editor de texto e mude:

```nsi
!define PRODUCT_NAME "Sublimix POS"          ← Nome do programa
!define PRODUCT_VERSION "2.0.0"              ← Versão
!define PRODUCT_PUBLISHER "Sublimix"         ← Seu nome/empresa
!define PRODUCT_WEB_SITE "https://..."       ← Seu site
```

Depois execute novamente `GERAR_INSTALADOR_OFFLINE.bat`

---

## 🎬 Vídeos de Referência

Se tiver dúvidas:
- **"NSIS Installer Tutorial"**: https://www.youtube.com/watch?v=Z5RGwxZXt4I
- **"Create Windows Installer with NSIS"**: https://www.youtube.com/watch?v=OilA64TSAOA

---

## ✅ Pronto para distribuir!

Você agora tem:
- **`Sublimix-Instalador.exe`** ← Envie este arquivo
- Profissional
- Fácil de instalar
- Uma único clique é suficiente

**Pode enviar por email, Dropbox, Google Drive, etc!**

---

## 🆘 Problemas?

| Problema | Solução |
|----------|---------|
| "NSIS não encontrado" | Instale NSIS de https://nsis.sourceforge.io/ |
| "Erro ao compilar" | Reinicie o Windows após instalar NSIS |
| "Falta arquivo" | Certifique-se que está na pasta Sublimix 2.0 |
| "Instalador não funciona" | Node.js não está instalado no PC destino |

---

**Questionamento? Veja GUIA_DISTRIBUICAO.md**
