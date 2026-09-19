
// para mudar CNPJ
const CONFIG_EMPRESA = {
    nome: "SUBLIMIX PDV",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Principal, 500",
    contato: "www.sublimix.com.br"
};

// Função de Logout
function fazerLogout() {
    if (confirm('Você tem certeza que deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Dados simulados em localStorage
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
    let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

    function produtoDaApi(produto) {
        return {
            id: produto.id,
            cod: produto.codigo,
            data: produto.criado_em ? produto.criado_em.slice(0, 10) : '',
            desc: produto.nome,
            unidade: produto.unidade || 'unid',
            custo: produto.preco_custo || 0,
            margem: produto.margem || 0,
            venda: produto.preco_venda,
            estoque: produto.estoque,
            estoqueAtual: produto.estoque,
            estoqueMinimo: produto.estoque_minimo || 0
        };
    }

    async function carregarProdutosDoBanco() {
        try {
            const resposta = await fetch('/api/products');
            if (!resposta.ok) throw new Error('Não foi possível carregar os produtos');
            const produtosBanco = await resposta.json();

            if (!localStorage.getItem('produtosMigradosParaBanco') && produtos.length) {
                for (const produto of produtos) {
                    await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nome: produto.desc,
                            codigo: produto.cod,
                            preco_venda: produto.venda || 0,
                            estoque: produto.estoque || 0,
                            estoque_minimo: produto.estoqueMinimo || 0
                        })
                    });
                }
                localStorage.setItem('produtosMigradosParaBanco', '1');
                return carregarProdutosDoBanco();
            }

            produtos = produtosBanco.map(produtoDaApi);
            localStorage.setItem('produtos', JSON.stringify(produtos));
            atualizarTabelaProduto();
            atualizarTabelaEstoque();
            if (document.getElementById('modalProdutosBody')) preencherTabelaProdutosModal(produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos do banco:', error);
            atualizarTabelaProduto();
        }
    }

    // Carrinho de vendas (Caixa)
    let carrinho = [];
    let totalVenda = 0;
    let totalPagamento = 0;
    let ultimaVenda = null; // Para armazenar detalhes da última venda para comprovante

    function initCaixa() {
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                abrirModalProdutosCaixa();
            }
            if (e.key === 'F7') {
                e.preventDefault();
                cancelarVenda();
            }
            if (e.key === 'F8') {
                e.preventDefault();
                finalizarVenda();
            }
        });

        // Atualiza informações iniciais
        atualizarCaixa();
    }

    // Modal do Caixa / seleção de produto
    let produtoSelecionadoModal = null;
    let voltarAoCaixaDepoisDoCadastro = false;

    function abrirModalProdutosCaixa() {
        if (!caixaAberto) {
            alert('Abra o caixa antes de consultar produtos para uma venda.');
            return;
        }
        produtoSelecionadoModal = null;
        document.getElementById('modalBuscaProduto').value = '';
        preencherTabelaProdutosModal(produtos);
        document.getElementById('modalProdutosCaixa').style.display = 'flex';
    }

    function fecharModalProdutosCaixa() {
        document.getElementById('modalProdutosCaixa').style.display = 'none';
    }

    function abrirCadastroProduto() {
        voltarAoCaixaDepoisDoCadastro = true;
        fecharModalProdutosCaixa();
        const itemProduto = document.querySelector('.menu li[onclick*="screen-produto"]');
        mudarTela('screen-produto', itemProduto);
        novoProduto();
        document.getElementById('prodDesc').focus();
    }

    function preencherTabelaProdutosModal(lista) {
    const tbody = document.getElementById('modalProdutosBody');
    tbody.innerHTML = '';
    
    // IMPORTANTE: Reseta o índice toda vez que a tabela é redesenhada
    indiceLinhaSelecionada = -1; 

    lista.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        
        // Ao clicar, ele seleciona E confirma (manda para o carrinho)
        tr.onclick = () => {
            selecionarProdutoModal(idx, lista);
            confirmarProdutoModal(); // Adicionado para o Enter/Clique funcionar direto
        };

        tr.innerHTML = `
            <td>${p.cod}</td>
            <td>${p.data || ''}</td>
            <td>${p.desc}</td>
            <td>${p.unidade || 'Un'}</td>
            <td>R$ ${parseFloat(p.venda || 0).toFixed(2)}</td>
            <td>${p.estoque || 0}</td>
            <td>${p.estoqueMinimo || 0}</td>
            <td>${(parseFloat(p.estoque || 0) - parseFloat(p.saida || 0)).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

   function filtrarProdutosModal() {
    // 1. RESET AQUI: Toda vez que o usuário digita, a seleção volta ao topo (nenhuma linha)
    indiceLinhaSelecionada = -1; 

    const filtro = document.getElementById('modalBuscaProduto').value.trim().toLowerCase();
    
    if (!filtro) {
        preencherTabelaProdutosModal(produtos);
        return;
    }
    
    const filtrados = produtos.filter(p =>
        (p.cod || '').toLowerCase().includes(filtro) ||
        (p.desc || '').toLowerCase().includes(filtro)
    );
    
    preencherTabelaProdutosModal(filtrados);
}

    function selecionarProdutoModal(idx, lista) {
    const p = lista[idx];
    produtoSelecionadoModal = p; // Esta linha é vital!
    
    // Seu código de destaque visual (background) continua aqui...
    document.querySelectorAll('#modalProdutosBody tr').forEach((row, i) => {
        row.style.background = i === idx ? '#e0f7fa' : 'transparent';
    });
}
    function confirmarProdutoModal() {
    if (!produtoSelecionadoModal) {
        alert('Selecione um produto antes de confirmar.');
        return;
    }

    // Fecha o modal de busca de produtos
    fecharModalProdutosCaixa();

    // Leva o foco para o campo de quantidade automaticamente
    const campoQtd = document.getElementById('caixaInputQtd');
    if (campoQtd) {
        campoQtd.value = '1'; // Reseta para 1 para facilitar
        campoQtd.focus();
        campoQtd.select(); // Deixa o texto selecionado para o usuário apenas digitar o novo número
    }
}
    function consultarProdutoCaixa() {
        abrirModalProdutosCaixa();
    }

    function adicionarAoCarrinho(produto, quantidade) {
        // Validar quantidade
        const qtd = parseFloat(quantidade) || 0;
        if (qtd <= 0) {
            alert('⚠️ Quantidade inválida! Digite um número maior que 0.');
            return;
        }

        // Obter valor de venda (tenta múltiplas chaves para compatibilidade)
        const valor = parseFloat(produto.venda || produto.preco || produto.valor || 0);
        if (valor <= 0) {
            alert('⚠️ ERRO: Este produto não tem preço cadastrado!\n\nVá ao módulo de Produtos e adicione o preço de venda.');
            return;
        }

        // Validar estoque
        const estoque = parseFloat(produto.estoque || 0);
        if (estoque < qtd) {
            alert(`⚠️ Estoque insuficiente!\nDisponível: ${estoque.toFixed(2)} ${produto.unidade || 'Un'}`);
            return;
        }

        // Adicionar ao carrinho
        const existente = carrinho.find(item => item.cod === produto.cod);
        if (existente) {
            existente.qtd += qtd;
        } else {
            carrinho.push({
                cod: produto.cod,
                desc: produto.desc,
                unidade: produto.unidade || 'Un',
                valor: valor,
                qtd: qtd
            });
        }
        atualizarCaixa();
    }

    function atualizarCaixa() {
        const tbody = document.querySelector('#screen-caixa .caixa-tabela tbody');
        tbody.innerHTML = '';

        totalVenda = 0;
        carrinho.forEach(item => {
            const total = item.qtd * item.valor;
            totalVenda += total;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${item.cod}</td><td>${item.desc}</td><td>${item.qtd.toFixed(2)}</td><td>${item.valor.toFixed(2)}</td><td>${total.toFixed(2)}</td>`;
            tbody.appendChild(tr);
        });

        document.getElementById('caixaPrecoUnit').innerText = carrinho.length ? `R$ ${carrinho[carrinho.length - 1].valor.toFixed(2)}` : 'R$ 0,00';
        document.getElementById('caixaTotalItem').innerText = carrinho.length ? `R$ ${(carrinho[carrinho.length - 1].qtd * carrinho[carrinho.length - 1].valor).toFixed(2)}` : 'R$ 0,00';
        document.getElementById('caixaUnidade').innerText = carrinho.length ? carrinho[carrinho.length - 1].unidade : 'Un';
        document.getElementById('caixaTotalGeral').innerText = `R$ ${totalVenda.toFixed(2)}`;

        document.getElementById('valorVenda').innerText = `R$ ${totalVenda.toFixed(2)}`;
        document.getElementById('valorPagamento').innerText = `R$ ${totalPagamento.toFixed(2)}`;
    }

    function aplicarPagamento(forma) {
        if (totalVenda <= 0) {
            alert('Nenhum item no carrinho para pagar.');
            return;
        }
        const valorPago = totalVenda;
        totalPagamento += valorPago;
        if (!dadosTotais[forma]) dadosTotais[forma] = 0;
        dadosTotais[forma] += valorPago;
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        totalVenda = 0;
        carrinho = [];
        atualizarCaixa();
        initTotais();
        alert(`Pagamento de R$ ${valorPago.toFixed(2)} registrado em ${forma}.`);
    }

    function cancelarVenda() {
        if (!confirm('Cancelar a venda atual?')) return;
        carrinho = [];
        totalVenda = 0;
        totalPagamento = 0;
        atualizarCaixa();
    }

    function finalizarVenda() {
        if (!caixaAberto) {
            alert('Abra o caixa antes de finalizar uma venda.');
            return;
        }
        // Validar se há itens no carrinho
        if (!carrinho || carrinho.length === 0) {
            alert('⚠️ Carrinho vazio!\n\n👉 Use F3 ou clique em Consultar Produto para adicionar itens.');
            return;
        }

        // Validar se o total está correto
        if (totalVenda <= 0) {
            alert('⚠️ ERRO: Total da venda é R$ 0!\n\nVerifique os produtos ou preços cadastrados.\n\nDica: Vá ao módulo Produtos e verifique se os preços estão configurados.');
            return;
        }

        // Abrir modal de pagamento
        abrirModalPagamentoCaixa();
    }

    function abrirModalPagamentoCaixa() {
        document.getElementById('modalTotalPagamento').innerText = `R$ ${totalVenda.toFixed(2)}`;
        document.getElementById('modalPagamentoCaixa').style.display = 'flex';
    }

    function fecharModalPagamentoCaixa() {
        document.getElementById('modalPagamentoCaixa').style.display = 'none';
    }

    function confirmarPagamento(formaPagamento) {
        const valorPago = totalVenda;
        
        // Registrar baixa de estoque com detalhes
        let resumoBaixa = '📦 PRODUTOS VENDIDOS - BAIXA DE ESTOQUE:\n\n';
        
        // Fazer baixa de estoque
        carrinho.forEach(item => {
            const prodIdx = produtos.findIndex(p => p.cod === item.cod);
            if (prodIdx >= 0) {
                const estoque = parseFloat(produtos[prodIdx].estoque) || 0;
                const novoEstoque = Math.max(0, estoque - item.qtd);
                produtos[prodIdx].estoque = novoEstoque;
                
                // Adicionar detalhes do produto ao resumo
                resumoBaixa += `✓ ${produtos[prodIdx].desc}\n`;
                resumoBaixa += `   Código: ${item.cod}\n`;
                resumoBaixa += `   Qtd Vendida: ${item.qtd} ${item.unidade}\n`;
                resumoBaixa += `   Estoque Anterior: ${estoque.toFixed(2)}\n`;
                resumoBaixa += `   Novo Estoque: ${novoEstoque.toFixed(2)}\n\n`;
            }
        });
        
        localStorage.setItem('produtos', JSON.stringify(produtos));
        
        // Registrar transação
        if (!dadosTotais) dadosTotais = {};
        if (!dadosTotais[formaPagamento]) dadosTotais[formaPagamento] = 0;
        dadosTotais[formaPagamento] += valorPago;
        
        // Salvar detalhes da venda para comprovante
        ultimaVenda = {
            data: new Date().toLocaleString('pt-BR'),
            itens: [...carrinho],
            total: valorPago,
            formaPagamento: formaPagamento,
            valorPago: valorPago,
            troco: 0
        };
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        
        // Salvar no histórico de vendas
        salvarVendaNosHistorico(ultimaVenda);
        
        // Limpar caixa
        totalVenda = 0;
        totalPagamento = 0;
        carrinho = [];
        atualizarCaixa();
        initTotais();
        fecharModalPagamentoCaixa();
        
        // Mostrar comprovante
        gerarComprovante(ultimaVenda);
        
        // Mostrar resumo da venda e baixa de estoque
        alert(`✅ VENDA FINALIZADÀ! 🎉\n\n${resumoBaixa}Forma de Pagamento: ${formaPagamento}\nTotal: R$ ${valorPago.toFixed(2)}`);
    }

    // Pagamento em Dinheiro
    function abrirPagamentoDinheiro() {
        document.getElementById('dinheiroTotalVenda').innerText = totalVenda.toFixed(2);
        document.getElementById('dinheiroValorPago').value = '';
        document.getElementById('dinheiroTroco').innerText = '0,00';
        document.getElementById('modalPagamentoCaixa').style.display = 'none';
        document.getElementById('modalDinheiroCaixa').style.display = 'flex';
    }

    function fecharModalDinheiroCaixa() {
        document.getElementById('modalDinheiroCaixa').style.display = 'none';
        document.getElementById('modalPagamentoCaixa').style.display = 'flex';
    }

    function calcularTroco() {
        const total = totalVenda;
        const valorPago = parseFloat(document.getElementById('dinheiroValorPago').value) || 0;
        const troco = valorPago - total;
        document.getElementById('dinheiroTroco').innerText = troco >= 0 ? troco.toFixed(2) : '0,00';
        document.getElementById('dinheiroTroco').parentElement.style.background = troco >= 0 ? '#e8f5e9' : '#ffebee';
    }

    function confirmarPagamentoDinheiro() {
        const total = totalVenda;
        const valorPago = parseFloat(document.getElementById('dinheiroValorPago').value) || 0;
        
        if (valorPago < total) {
            alert(`Valor insuficiente! Faltam R$ ${(total - valorPago).toFixed(2)}`);
            return;
        }

        const troco = valorPago - total;
        if (processarRecebimentoPendente('Dinheiro', valorPago, troco)) return;
        
        // Registrar baixa de estoque com detalhes
        let resumoBaixa = '📦 PRODUTOS VENDIDOS - BAIXA DE ESTOQUE:\n\n';
        
        // Fazer baixa de estoque
        carrinho.forEach(item => {
            const prodIdx = produtos.findIndex(p => p.cod === item.cod);
            if (prodIdx >= 0) {
                const estoque = parseFloat(produtos[prodIdx].estoque) || 0;
                const novoEstoque = Math.max(0, estoque - item.qtd);
                produtos[prodIdx].estoque = novoEstoque;
                
                // Adicionar detalhes do produto ao resumo
                resumoBaixa += `✓ ${produtos[prodIdx].desc}\n`;
                resumoBaixa += `   Código: ${item.cod}\n`;
                resumoBaixa += `   Qtd Vendida: ${item.qtd} ${item.unidade}\n`;
                resumoBaixa += `   Estoque Anterior: ${estoque.toFixed(2)}\n`;
                resumoBaixa += `   Novo Estoque: ${novoEstoque.toFixed(2)}\n\n`;
            }
        });
        
        localStorage.setItem('produtos', JSON.stringify(produtos));
        
        // Registrar transação
        if (!dadosTotais) dadosTotais = {};
        if (!dadosTotais['Dinheiro']) dadosTotais['Dinheiro'] = 0;
        dadosTotais['Dinheiro'] += total;
        
        // Salvar detalhes da venda para comprovante
        ultimaVenda = {
            data: new Date().toLocaleString('pt-BR'),
            itens: [...carrinho],
            total: total,
            formaPagamento: 'Dinheiro',
            valorPago: valorPago,
            troco: troco
        };
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        
        // Salvar no histórico de vendas
        salvarVendaNosHistorico(ultimaVenda);
        
        // Limpar caixa
        totalVenda = 0;
        totalPagamento = 0;
        carrinho = [];
        atualizarCaixa();
        initTotais();
        document.getElementById('modalDinheiroCaixa').style.display = 'none';
        document.getElementById('modalPagamentoCaixa').style.display = 'none';
        
        // Mostrar o resumo antes do comprovante para não bloquear seus botões.
        alert(`✅ VENDA FINALIZADÀ! 🎉\n\n${resumoBaixa}Forma de Pagamento: Dinheiro\nTotal: R$ ${total.toFixed(2)}\nTroco: R$ ${troco.toFixed(2)}`);

        // Mostrar comprovante com a opção de impressão disponível.
        gerarComprovante(ultimaVenda);
    }

    // Pagamento em Pix
    function abrirPagamentoPix() {
        document.getElementById('pixTotalVenda').innerText = totalVenda.toFixed(2);
        document.getElementById('modalPagamentoCaixa').style.display = 'none';
        document.getElementById('modalPixCaixa').style.display = 'flex';
        // Aqui você pode adicionar código para gerar o QR code real
        // Por enquanto, mostramos placeholder
        gerarQrCodePix();
    }

    function fecharModalPixCaixa() {
    const modal = document.getElementById('modalPixCaixa');
    // Só tenta mudar o style se o modal existir e estiver na tela
    if (modal) {
        modal.style.display = 'none';
        console.log("Modal Pix fechado.");
    }
}

    function gerarQrCodePix() {
    const qrDiv = document.getElementById('pixQrDisplay');
    const dadosBrutos = localStorage.getItem('pixChaves');
    const chaves = JSON.parse(dadosBrutos || '[]');
    
    console.log("Tentando gerar QR Code. Chaves encontradas:", chaves);

    if (!qrDiv) return; // Segurança caso a div suma

    // Busca a primeira chave que tenha o campo qrCode preenchido
    const pixComQr = chaves.find(p => p.qrCode && p.qrCode.length > 0);

    if (pixComQr) {
        qrDiv.innerHTML = `
            <div style="text-align: center;">
                <img src="${pixComQr.qrCode}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #eee;">
                <div style="margin-top: 10px;">
                    <strong>${pixComQr.nome}</strong><br>
                    <span style="font-size: 0.9em;">${pixComQr.chave} (${pixComQr.tipo})</span>
                </div>
            </div>`;
    } else {
        qrDiv.innerHTML = `
            <div style="text-align: center; color: #d32f2f;">
                <strong>⚠️ QR Code não encontrado</strong><br>
                <small>Cadastre a imagem em Configurações > Pix</small>
            </div>`;
    }
}

    function confirmarPagamentoPix() {
        const valorPago = totalVenda;
        if (processarRecebimentoPendente('Pix', valorPago, 0)) return;
        
        // Registrar baixa de estoque com detalhes
        let resumoBaixa = '📦 PRODUTOS VENDIDOS - BAIXA DE ESTOQUE:\n\n';
        
        // Fazer baixa de estoque
        carrinho.forEach(item => {
            const prodIdx = produtos.findIndex(p => p.cod === item.cod);
            if (prodIdx >= 0) {
                const estoque = parseFloat(produtos[prodIdx].estoque) || 0;
                const novoEstoque = Math.max(0, estoque - item.qtd);
                produtos[prodIdx].estoque = novoEstoque;
                
                // Adicionar detalhes do produto ao resumo
                resumoBaixa += `✓ ${produtos[prodIdx].desc}\n`;
                resumoBaixa += `   Código: ${item.cod}\n`;
                resumoBaixa += `   Qtd Vendida: ${item.qtd} ${item.unidade}\n`;
                resumoBaixa += `   Estoque Anterior: ${estoque.toFixed(2)}\n`;
                resumoBaixa += `   Novo Estoque: ${novoEstoque.toFixed(2)}\n\n`;
            }
        });
        
        localStorage.setItem('produtos', JSON.stringify(produtos));
        
        // Registrar transação
        if (!dadosTotais) dadosTotais = {};
        if (!dadosTotais['Pix']) dadosTotais['Pix'] = 0;
        dadosTotais['Pix'] += valorPago;
        
        // Salvar detalhes da venda para comprovante
        ultimaVenda = {
            data: new Date().toLocaleString('pt-BR'),
            itens: [...carrinho],
            total: valorPago,
            formaPagamento: 'Pix',
            valorPago: valorPago,
            troco: 0
        };
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        
        // Salvar no histórico de vendas
        salvarVendaNosHistorico(ultimaVenda);
        
        // Limpar caixa
        totalVenda = 0;
        totalPagamento = 0;
        carrinho = [];
        atualizarCaixa();
        initTotais();
        fecharModalPixCaixa();
        
        // Mostrar comprovante
        gerarComprovante(ultimaVenda);
        
        // Mostrar resumo da venda e baixa de estoque
        alert(`✅ VENDA FINALIZADÀ! 🎉\n\n${resumoBaixa}Forma de Pagamento: Pix\nTotal: R$ ${valorPago.toFixed(2)}`);
    }

    // ========== FUNÇÕES DE COMPROVANTE ==========

    function obterDadosEmpresa() {
        return JSON.parse(localStorage.getItem('empresaDados') || '{}');
    }

    function escaparHtml(valor) {
        return String(valor || '').replace(/[&<>'"]/g, caractere => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[caractere]));
    }

    function gerarCabecalhoEmpresa() {
        const empresa = obterDadosEmpresa();
        const nome = empresa.fantasia || empresa.razao || 'Sublimix';
        const endereco = [empresa.logradouro, empresa.numero, empresa.complemento]
            .filter(Boolean).join(', ');
        const localidade = [empresa.bairro, empresa.cidade, empresa.uf]
            .filter(Boolean).join(' - ');
        const contato = empresa.contatotel ? `Contato: ${empresa.contatotel}` : '';

        return `
            <div class="documento-empresa">
                <div class="empresa-nome">${escaparHtml(nome)}</div>
                ${empresa.razao && empresa.fantasia ? `<div>${escaparHtml(empresa.razao)}</div>` : ''}
                ${empresa.cnpj ? `<div>CNPJ: ${escaparHtml(empresa.cnpj)}${empresa.ie ? ` | IE: ${escaparHtml(empresa.ie)}` : ''}</div>` : ''}
                ${endereco ? `<div>${escaparHtml(endereco)}</div>` : ''}
                ${localidade ? `<div>${escaparHtml(localidade)}</div>` : ''}
                ${contato ? `<div>${escaparHtml(contato)}</div>` : ''}
            </div>
        `;
    }

    function estilosImpressao() {
        return `
            * { box-sizing: border-box; }
            body { margin: 0; padding: 12px; color: #111; background: #fff; font-family: monospace; font-size: 12px; }
            .documento { max-width: 380px; margin: 0 auto; }
            .documento-empresa { text-align: center; padding-bottom: 10px; border-bottom: 2px solid #111; line-height: 1.45; }
            .empresa-nome { font-size: 17px; font-weight: 700; text-transform: uppercase; }
            .documento-titulo { text-align: center; font-weight: 700; font-size: 14px; margin: 12px 0 8px; }
            .documento-linha { border-bottom: 1px dotted #555; padding: 4px 0; }
            .documento-total { border-top: 2px solid #111; margin-top: 8px; padding-top: 8px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 2px; text-align: left; border-bottom: 1px dotted #777; }
            th:last-child, td:last-child { text-align: right; }
            .texto-centro { text-align: center; }
            @page { margin: 8mm; }
            @media print { body { padding: 0; } }
        `;
    }

    function imprimirDocumento(titulo, conteudo) {
        const janela = window.open('', '', 'height=700,width=450');
        if (!janela) {
            alert('Permita pop-ups para imprimir o documento.');
            return;
        }
        janela.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title><style>${estilosImpressao()}</style></head><body><main class="documento">${conteudo}</main></body></html>`);
        janela.document.close();
        janela.focus();
        setTimeout(() => { janela.print(); janela.close(); }, 250);
    }
    
    function gerarComprovante(venda) {
        // Validar dados
        if (!venda || !venda.itens || venda.itens.length === 0) {
            console.log('Nenhuma venda para gerar comprovante');
            return;
        }

        // Gerar HTML do comprovante
        let html = `
            ${gerarCabecalhoEmpresa()}
            <div class="documento-titulo">COMPROVANTE DE VENDA</div>
            
            <div class="documento-linha">
                <div><strong>Data/Hora:</strong> ${venda.data}</div>
                <div><strong>Forma Pagamento:</strong> ${venda.formaPagamento}</div>
            </div>
            
            <div style="font-weight:bold; margin: 10px 0 5px;">ITENS DA VENDA</div>
            
            <table>
                <thead><tr><th>Descrição</th><th>Qtd.</th><th>Total</th></tr></thead>
                <tbody>
        `;

        // Adicionar itens da venda
        let subtotal = 0;
        venda.itens.forEach(item => {
            const total = item.qtd * item.valor;
            subtotal += total;
            html += `
                <tr>
                    <td>${escaparHtml(item.desc)}<br><small>R$ ${item.valor.toFixed(2)} un.</small></td>
                    <td>${item.qtd}x</td>
                    <td>R$ ${total.toFixed(2)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span><strong>Subtotal:</strong></span>
                    <span>R$ ${subtotal.toFixed(2)}</span>
                </div>
        `;

        // Adicionar dados de pagamento
        if (venda.formaPagamento === 'Dinheiro') {
            html += `
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span><strong>Valor Pago:</strong></span>
                    <span>R$ ${venda.valorPago.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0; border-top: 2px solid #000; padding-top: 5px;">
                    <span><strong>Troco:</strong></span>
                    <span>R$ ${venda.troco.toFixed(2)}</span>
                </div>
            `;
        }

        html += `
                <div class="documento-total" style="display: flex; justify-content: space-between;">
                    <span>TOTAL:</span>
                    <span>R$ ${venda.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="texto-centro" style="margin-top: 16px;">Obrigado pela preferência!</div>
        `;

        // Mostrar o comprovante no modal
        document.getElementById('conteudoComprovante').innerHTML = html;
        document.getElementById('modalComprovante').style.display = 'flex';
    }

    function fecharModalComprovante() {
        document.getElementById('modalComprovante').style.display = 'none';
    }

    function imprimirComprovante() {
        const conteudo = document.getElementById('conteudoComprovante').innerHTML;
        imprimirDocumento('Comprovante de Venda', conteudo);
    }

    // Função auxiliar para imprimir (compatibilidade)
    function imprimirVenda() {
        if (!ultimaVenda || !ultimaVenda.itens || ultimaVenda.itens.length === 0) {
            alert('⚠️ Nenhuma venda para imprimir!');
            return;
        }
        imprimirComprovante();
    }

    // --- HISTÓRICO DE VENDAS ---
    function salvarVendaNosHistorico(venda) {
        let historico = JSON.parse(localStorage.getItem('historicoVendas')) || [];
        historico.push(venda);
        // Manter apenas as últimas 100 vendas
        if (historico.length > 100) {
            historico = historico.slice(-100);
        }
        localStorage.setItem('historicoVendas', JSON.stringify(historico));
    }

    function abrirModalHistorico() {
        const historico = JSON.parse(localStorage.getItem('historicoVendas')) || [];
        
        if (historico.length === 0) {
            alert('📜 Nenhuma venda registrada no histórico!');
            return;
        }
        
        // Inverter para mostrar as mais recentes primeiro
        const historicoInvertido = [...historico].reverse();
        
        let opcoes = '';
        historicoInvertido.forEach((venda, idx) => {
            const total = venda.total.toFixed(2);
            const forma = venda.formaPagamento;
            opcoes += `<option value="${idx}">${venda.data} - R$ ${total} (${forma})</option>`;
        });
        
        document.getElementById('selectHistoricoVendas').innerHTML = opcoes;
        document.getElementById('modalHistoricoVendas').style.display = 'flex';
    }

    function fecharModalHistorico() {
        document.getElementById('modalHistoricoVendas').style.display = 'none';
    }

    function imprimirVendaHistorico() {
        const historicoInvertido = [...(JSON.parse(localStorage.getItem('historicoVendas')) || [])].reverse();
        const idx = parseInt(document.getElementById('selectHistoricoVendas').value);
        
        if (isNaN(idx) || !historicoInvertido[idx]) {
            alert('⚠️ Selecione uma venda válida!');
            return;
        }
        
        const vendaSelecionada = historicoInvertido[idx];
        
        // Mostrar no modal de comprovante
        document.getElementById('conteudoComprovante').innerHTML = gerarHTMLComprovante(vendaSelecionada);
        document.getElementById('modalComprovante').style.display = 'flex';
        fecharModalHistorico();
    }

    function gerarHTMLComprovante(venda) {
        if (!venda || !venda.itens || venda.itens.length === 0) {
            return '<div style="text-align:center;">Nenhuma informação disponível</div>';
        }

        let html = `
            <div style="text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 10px;">COMPROVANTE DE VENDA</div>
            <div style="text-align: center; margin-bottom: 15px; font-size: 0.85rem;">======================================</div>
            
            <div style="margin-bottom: 10px;">
                <div><strong>Data/Hora:</strong> ${venda.data}</div>
                <div><strong>Forma Pagamento:</strong> ${venda.formaPagamento}</div>
            </div>
            
            <div style="text-align: center; margin-bottom: 10px; font-size: 0.85rem;">======================================</div>
            <div><strong>ITENS DA VENDA</strong></div>
            <div style="text-align: center; margin-bottom: 10px; font-size: 0.85rem;">======================================</div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 10px;">
                <tbody>
        `;

        let subtotal = 0;
        venda.itens.forEach(item => {
            const total = item.qtd * item.valor;
            subtotal += total;
            html += `
                <tr style="border-bottom: 1px dotted #666;">
                    <td style="text-align: left; padding: 3px;">${item.desc}</td>
                    <td style="text-align: right; padding: 3px;">${item.qtd}x</td>
                    <td style="text-align: right; padding: 3px;">R$ ${item.valor.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px dotted #666;">
                    <td colspan="3" style="text-align: right; padding: 3px; font-size: 0.8rem;">Subtotal: R$ ${total.toFixed(2)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            
            <div style="text-align: center; margin-bottom: 10px; font-size: 0.85rem;">======================================</div>
            
            <div style="font-size: 0.9rem; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span><strong>Subtotal:</strong></span>
                    <span>R$ ${subtotal.toFixed(2)}</span>
                </div>
        `;

        if (venda.formaPagamento === 'Dinheiro') {
            html += `
                <div style="display: flex; justify-content: space-between; margin: 3px 0;">
                    <span><strong>Valor Pago:</strong></span>
                    <span>R$ ${venda.valorPago.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 3px 0; border-top: 2px solid #000; padding-top: 5px;">
                    <span><strong>Troco:</strong></span>
                    <span>R$ ${venda.troco.toFixed(2)}</span>
                </div>
            `;
        }

        html += `
                <div style="display: flex; justify-content: space-between; margin: 5px 0; border-top: 2px solid #000; padding-top: 5px; font-weight: bold; font-size: 1rem;">
                    <span>TOTAL:</span>
                    <span>R$ ${venda.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 0.85rem;">======================================</div>
            <div style="text-align: center; font-size: 0.8rem; margin-top: 10px; color: #666;">Obrigado pela preferência!</div>
            <div style="text-align: center; font-size: 0.75rem; margin-top: 5px; color: #999;">SUBLIMIX - Sistema POS</div>
        `;
        
        return html;
    }

    function abrirModalSuprimento() {
        document.getElementById('suprimentoValor').value = '';
        document.getElementById('modalSuprimentoCaixa').style.display = 'flex';
    }

    function fecharModalSuprimento() {
        document.getElementById('modalSuprimentoCaixa').style.display = 'none';
    }

    function confirmarSuprimento() {
        const valor = parseFloat(document.getElementById('suprimentoValor').value) || 0;
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        
        if (!dadosTotais) dadosTotais = {};
        if (!dadosTotais['Suprimento']) dadosTotais['Suprimento'] = 0;
        dadosTotais['Suprimento'] += valor;
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        
        alert(`Suprimento de R$ ${valor.toFixed(2)} registrado!`);
        initTotais();
        fecharModalSuprimento();
    }

    function abrirModalSangria() {
        document.getElementById('sangriaValor').value = '';
        document.getElementById('sangriaDescricao').value = '';
        document.getElementById('modalSangriaCaixa').style.display = 'flex';
        document.getElementById('sangriaDescricao').focus();
    }

    function fecharModalSangria() {
        document.getElementById('modalSangriaCaixa').style.display = 'none';
    }

    function confirmarSangria() {
        const valor = parseFloat(document.getElementById('sangriaValor').value) || 0;
        const descricao = document.getElementById('sangriaDescricao').value.trim();
        if (valor <= 0) {
            alert('Digite um valor válido!');
            return;
        }
        if (!descricao) {
            alert('Informe o que saiu na sangria.');
            document.getElementById('sangriaDescricao').focus();
            return;
        }
        
        if (!dadosTotais) dadosTotais = {};
        if (!dadosTotais['Sangria']) dadosTotais['Sangria'] = 0;
        dadosTotais['Sangria'] += valor;
        detalhesTotais.push({
            data: new Date().toLocaleString('pt-BR'),
            forma: 'Sangria',
            valor,
            desc: descricao
        });
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        localStorage.setItem('detalhesTotais', JSON.stringify(detalhesTotais));
        
        alert(`Sangria de R$ ${valor.toFixed(2)} registrada: ${descricao}.`);
        initTotais();
        fecharModalSangria();
    }


    function mudarTela(id, el) {
        console.log('Mudando para tela:', id);
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
        el.classList.add('active');
        const titulos = { 'screen-caixa': 'Caixa', 'screen-pedido': 'Pedido', 'screen-produto': 'Produto', 'screen-cliente': 'Cliente', 'screen-totais': 'Totais em caixa', 'screen-relatorios': 'Relatórios', 'screen-catalogo': 'Catálogo', 'screen-backup': 'Backup', 'screen-configuracoes': 'Configurações', 'screen-fecharcaixa': 'Fechar Caixa', 'screen-recebimento': 'Recebimento', 'screen-devolucao': 'Devolução' };
        document.getElementById('titulo-header').innerText = titulos[id] || '';
        if (id === 'screen-relatorios') initRelatorios();
        if (id === 'screen-catalogo') initCatalogo();
        if (id === 'screen-backup') initBackup();
        if (id === 'screen-configuracoes') initConfiguracoes();
    }

    function trocarLabel() {
        const tipo = document.getElementById('cTipo').value;
        document.getElementById('labelCpf').innerText = tipo === 'PF' ? 'CPF*' : 'CNPJ*';
    }

    function calcP() {
        const c = parseFloat(document.getElementById('pCusto').value) || 0;
        const m = parseFloat(document.getElementById('pMargem').value) || 0;
        document.getElementById('pVenda').value = (c + (c * (m/100))).toFixed(2);
    }

    function calcTotalPedido() {
        const q = parseFloat(document.getElementById('pQtd').value) || 0;
        const v = parseFloat(document.getElementById('pVUnit').value) || 0;
        document.getElementById('pTotal').value = (q * v).toFixed(2);
        calcRestante();
    }

    function calcRestante() {
        const t = parseFloat(document.getElementById('pTotal').value) || 0;
        const e = parseFloat(document.getElementById('pEntrada').value) || 0;
        document.getElementById('pRestante').value = (t - e).toFixed(2);
    }

    // Funções para Cliente
    function limparCliente() {
        document.getElementById('cCod').value = '';
        document.getElementById('cData').value = '';
        document.getElementById('cNome').value = '';
        document.getElementById('cTipo').value = 'PF';
        document.getElementById('cCpf').value = '';
        document.getElementById('cCelular').value = '';
        document.getElementById('cEmail').value = '';
        document.getElementById('cCep').value = '';
        document.getElementById('cEndereco').value = '';
        document.getElementById('cNumero').value = '';
        document.getElementById('cBairro').value = '';
        document.getElementById('cComplemento').value = '';
        document.getElementById('cCidade').value = '';
        document.getElementById('cUf').value = '';
        document.getElementById('cObs').value = '';
        trocarLabel();
    }

    function novoCliente() {
        limparCliente();
        document.getElementById('cCod').value = 'CLI' + Math.floor(Math.random() * 999);
        document.getElementById('cData').value = new Date().toISOString().split('T')[0];
    }

    function cadastrarCliente() {
        const cliente = {
            cod: document.getElementById('cCod').value,
            data: document.getElementById('cData').value,
            nome: document.getElementById('cNome').value,
            tipo: document.getElementById('cTipo').value,
            cpf: document.getElementById('cCpf').value,
            celular: document.getElementById('cCelular').value,
            email: document.getElementById('cEmail').value,
            cep: document.getElementById('cCep').value,
            endereco: document.getElementById('cEndereco').value,
            numero: document.getElementById('cNumero').value,
            bairro: document.getElementById('cBairro').value,
            complemento: document.getElementById('cComplemento').value,
            cidade: document.getElementById('cCidade').value,
            uf: document.getElementById('cUf').value,
            obs: document.getElementById('cObs').value
        };
        clientes.push(cliente);
        localStorage.setItem('clientes', JSON.stringify(clientes));
        atualizarTabelaCliente();
        alert('Cliente Cadastrado!');
        limparCliente();
    }

    function atualizarTabelaCliente() {
        const tbody = document.querySelector('#screen-cliente .erp-tabela tbody');
        tbody.innerHTML = '';
        clientes.forEach((c, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${c.cod}</td><td>${c.data}</td><td>${c.nome}</td><td>${c.tipo}</td><td>${c.cpf}</td><td>${c.celular}</td><td>${c.email}</td><td>${c.endereco}</td><td>${c.cidade}</td><td>${c.uf}</td>`;
            tr.onclick = () => selecionarCliente(idx);
            tbody.appendChild(tr);
        });
    }

    function pesquisarCliente() {
        const termo = prompt('Digite o nome ou código do cliente:');
        if (termo) {
            const resultados = clientes.filter(c => c.nome.toLowerCase().includes(termo.toLowerCase()) || c.cod.toLowerCase().includes(termo.toLowerCase()));
            const tbody = document.querySelector('#screen-cliente .erp-tabela tbody');
            tbody.innerHTML = '';
            resultados.forEach((c, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${c.cod}</td><td>${c.data}</td><td>${c.nome}</td><td>${c.tipo}</td><td>${c.cpf}</td><td>${c.celular}</td><td>${c.email}</td><td>${c.endereco}</td><td>${c.cidade}</td><td>${c.uf}</td>`;
                tr.onclick = () => selecionarCliente(clientes.indexOf(c));
                tbody.appendChild(tr);
            });
        }
    }

    let clienteEditIndex = null;

    function selecionarCliente(idx) {
        clienteEditIndex = idx;
        const c = clientes[idx];
        document.getElementById('cCod').value = c.cod;
        document.getElementById('cData').value = c.data;
        document.getElementById('cNome').value = c.nome;
        document.getElementById('cTipo').value = c.tipo;
        document.getElementById('cCpf').value = c.cpf;
        document.getElementById('cCelular').value = c.celular;
        document.getElementById('cEmail').value = c.email;
        document.getElementById('cCep').value = c.cep;
        document.getElementById('cEndereco').value = c.endereco;
        document.getElementById('cNumero').value = c.numero;
        document.getElementById('cBairro').value = c.bairro;
        document.getElementById('cComplemento').value = c.complemento;
        document.getElementById('cCidade').value = c.cidade;
        document.getElementById('cUf').value = c.uf;
        document.getElementById('cObs').value = c.obs;
        trocarLabel();
    }

    function editarCliente() {
        if (clienteEditIndex === null) {
            alert('Selecione um cliente para editar.');
            return;
        }
        const c = clientes[clienteEditIndex];
        c.cod = document.getElementById('cCod').value;
        c.data = document.getElementById('cData').value;
        c.nome = document.getElementById('cNome').value;
        c.tipo = document.getElementById('cTipo').value;
        c.cpf = document.getElementById('cCpf').value;
        c.celular = document.getElementById('cCelular').value;
        c.email = document.getElementById('cEmail').value;
        c.cep = document.getElementById('cCep').value;
        c.endereco = document.getElementById('cEndereco').value;
        c.numero = document.getElementById('cNumero').value;
        c.bairro = document.getElementById('cBairro').value;
        c.complemento = document.getElementById('cComplemento').value;
        c.cidade = document.getElementById('cCidade').value;
        c.uf = document.getElementById('cUf').value;
        c.obs = document.getElementById('cObs').value;
        localStorage.setItem('clientes', JSON.stringify(clientes));
        atualizarTabelaCliente();
        alert('Cliente Editado!');
        limparCliente();
        clienteEditIndex = null;
    }

    function excluirCliente() {
        if (clienteEditIndex === null) {
            alert('Selecione um cliente para excluir.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            clientes.splice(clienteEditIndex, 1);
            localStorage.setItem('clientes', JSON.stringify(clientes));
            atualizarTabelaCliente();
            alert('Cliente Excluído!');
            limparCliente();
            clienteEditIndex = null;
        }
    }

    // Funções para Produto
    function limparProduto() {
        document.getElementById('prodCod').value = '';
        document.getElementById('prodCod').disabled = false;
        document.getElementById('prodData').value = '';
        document.getElementById('prodDesc').value = '';
        document.getElementById('prodUnidade').value = 'unid';
        document.getElementById('pCusto').value = '';
        document.getElementById('pMargem').value = '';
        document.getElementById('pVenda').value = '';
        document.getElementById('prodEstoque').value = '';
        document.getElementById('prodEstoqueAtual').value = '';
    }

    function novoProduto() {
        limparProduto();
        document.getElementById('prodCod').value = 'PRO' + Math.floor(Math.random() * 999);
        document.getElementById('prodData').value = new Date().toISOString().split('T')[0];
    }

    async function cadastrarProduto() {
        const produto = {
            cod: document.getElementById('prodCod').value,
            data: document.getElementById('prodData').value,
            desc: document.getElementById('prodDesc').value,
            unidade: document.getElementById('prodUnidade').value,
            custo: document.getElementById('pCusto').value,
            margem: document.getElementById('pMargem').value,
            venda: document.getElementById('pVenda').value,
            estoque: document.getElementById('prodEstoque').value,
            estoqueAtual: document.getElementById('prodEstoqueAtual').value
        };
        if (!produto.cod.trim() || !produto.desc.trim() || !produto.venda || Number.isNaN(Number(produto.venda)) || Number(produto.venda) < 0) {
            alert('Preencha o código, a descrição e um valor de venda válido.');
            return;
        }
        let resposta;
        try {
            resposta = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: produto.desc.trim(),
                    codigo: produto.cod.trim(),
                    preco_venda: Number(produto.venda),
                    estoque: Number(produto.estoque) || 0,
                    estoque_minimo: 0
                })
            });
        } catch (error) {
            alert('Não foi possível conectar ao banco. Feche o backend antigo e execute o INICIE_BACKEND.bat atualizado.');
            return;
        }
        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            alert(erro.message || 'Não foi possível salvar o produto no banco. Reinicie o backend e tente novamente.');
            return;
        }
        alert('Produto cadastrado no banco com sucesso!');
        limparProduto();
        await carregarProdutosDoBanco();
        if (voltarAoCaixaDepoisDoCadastro) {
            voltarAoCaixaDepoisDoCadastro = false;
            const itemCaixa = document.querySelector('.menu li[onclick*="screen-caixa"]');
            mudarTela('screen-caixa', itemCaixa);
            abrirModalProdutosCaixa();
        }
    }

    function atualizarTabelaProduto() {
        const tbody = document.querySelector('#screen-produto .erp-tabela tbody');
        tbody.innerHTML = '';
        produtos.forEach((p, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${p.cod}</td><td>${p.data}</td><td>${p.desc}</td><td>${p.unidade || 'unid'}</td><td>${p.custo}</td><td>${p.margem || 0}</td><td>${p.venda}</td><td>${p.estoque}</td>`;
            tr.onclick = () => selecionarProduto(idx);
            tbody.appendChild(tr);
        });
    }

    function pesquisarProduto() {
        const termo = prompt('Digite a descrição ou código do produto:');
        if (termo) {
            const resultados = produtos.filter(p => p.desc.toLowerCase().includes(termo.toLowerCase()) || p.cod.toLowerCase().includes(termo.toLowerCase()));
            const tbody = document.querySelector('#screen-produto .erp-tabela tbody');
            tbody.innerHTML = '';
            resultados.forEach((p, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${p.cod}</td><td>${p.data}</td><td>${p.desc}</td><td>${p.unidade || 'unid'}</td><td>${p.custo}</td><td>${p.margem || 0}</td><td>${p.venda}</td><td>${p.estoque}</td>`;
                tr.onclick = () => selecionarProduto(produtos.indexOf(p));
                tbody.appendChild(tr);
            });
        }
    }

    let produtoSelecionado = null;
    let emEdicao = false;

    function selecionarProduto(idx) {
        produtoSelecionado = idx;
        emEdicao = false;
        const p = produtos[idx];
        document.getElementById('prodCod').value = p.cod;
        document.getElementById('prodData').value = p.data;
        document.getElementById('prodDesc').value = p.desc;
        document.getElementById('prodUnidade').value = p.unidade;
        document.getElementById('pCusto').value = p.custo;
        document.getElementById('pMargem').value = p.margem;
        document.getElementById('pVenda').value = p.venda;
        document.getElementById('prodEstoque').value = p.estoque;
        document.getElementById('prodEstoqueAtual').value = p.estoqueAtual;
        desabilitarCamposProduto();
    }

    function desabilitarCamposProduto() {
        document.getElementById('prodCod').disabled = true;
        document.getElementById('prodData').disabled = true;
        document.getElementById('prodDesc').disabled = true;
        document.getElementById('prodUnidade').disabled = true;
        document.getElementById('pCusto').disabled = true;
        document.getElementById('pMargem').disabled = true;
        document.getElementById('pVenda').disabled = true;
        document.getElementById('prodEstoque').disabled = true;
        document.getElementById('prodEstoqueAtual').disabled = true;
        emEdicao = false;
    }

    function enableEdicaoProduto() {
        if (produtoSelecionado === null) {
            alert('⚠️ Selecione um produto clicando na tabela antes de editar.');
            return;
        }
        
        // Habilitar campos
        document.getElementById('prodCod').disabled = false;
        document.getElementById('prodData').disabled = false;
        document.getElementById('prodDesc').disabled = false;
        document.getElementById('prodUnidade').disabled = false;
        document.getElementById('pCusto').disabled = false;
        document.getElementById('pMargem').disabled = false;
        document.getElementById('pVenda').disabled = false;
        document.getElementById('prodEstoque').disabled = false;
        document.getElementById('prodEstoqueAtual').disabled = false;
        
        emEdicao = true;
        
        // Feedback visual
        document.getElementById('prodDesc').focus();
        alert('✏️ Campos habilitados para edição!\n\nFaça as alterações e clique em "Salvar Edição"');
    }

    async function editarProduto() {
        if (produtoSelecionado === null) {
            alert('⚠️ Selecione um produto para editar.');
            return;
        }
        
        if (!emEdicao) {
            alert('⚠️ Clique em "Habilitar Edição" primeiro para editar o produto.');
            return;
        }

        const p = produtos[produtoSelecionado];
        p.cod = document.getElementById('prodCod').value;
        p.data = document.getElementById('prodData').value;
        p.desc = document.getElementById('prodDesc').value;
        p.unidade = document.getElementById('prodUnidade').value;
        p.custo = document.getElementById('pCusto').value;
        p.margem = document.getElementById('pMargem').value;
        p.venda = document.getElementById('pVenda').value;
        p.estoque = document.getElementById('prodEstoque').value;
        p.estoqueAtual = document.getElementById('prodEstoqueAtual').value;
        
        const resposta = await fetch(`/api/products/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: p.desc,
                codigo: p.cod,
                preco_venda: p.venda || 0,
                estoque: p.estoqueAtual || p.estoque || 0,
                estoque_minimo: p.estoqueMinimo || 0
            })
        });
        if (!resposta.ok) {
            alert('Não foi possível atualizar o produto no banco.');
            return;
        }
        await carregarProdutosDoBanco();
        
        // Feedback melhorado
        alert('✅ Produto salvo com sucesso!');
        
        // Desabilitar campos e limpar
        desabilitarCamposProduto();
        limparProduto();
        produtoSelecionado = null;
    }

    async function excluirProduto() {
        if (produtoSelecionado === null) {
            alert('Selecione um produto para excluir.');
            return;
        }
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            const produto = produtos[produtoSelecionado];
            const resposta = await fetch(`/api/products/${produto.id}`, { method: 'DELETE' });
            if (!resposta.ok) {
                alert('Não foi possível excluir o produto no banco.');
                return;
            }
            await carregarProdutosDoBanco();
            alert('Produto excluído!');
            limparProduto();
            produtoSelecionado = null;
        }
    }

    // Função para exportar produtos para XLSX
    function exportarProdutosXLSX() {
        if (produtos.length === 0) {
            alert('Nenhum produto cadastrado para exportar.');
            return;
        }

        // Preparar dados com headers
        const dadosExportar = [
            ['Código', 'Data', 'Descrição', 'Unidade', 'Custo', 'Margem (%)', 'Valor Venda', 'Estoque'],
            ...produtos.map(p => [
                p.cod || '',
                p.data || '',
                p.desc || '',
                p.unidade || '',
                p.custo || '',
                p.margem || '',
                p.venda || '',
                p.estoque || ''
            ])
        ];

        // Criar workbook e worksheet
        const ws = XLSX.utils.aoa_to_sheet(dadosExportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

        // Ajustar largura das colunas
        ws['!cols'] = [
            { wch: 12 },  // Código
            { wch: 12 },  // Data
            { wch: 25 },  // Descrição
            { wch: 10 },  // Unidade
            { wch: 12 },  // Custo
            { wch: 10 },  // Margem
            { wch: 12 },  // Venda
            { wch: 10 }   // Estoque
        ];

        // Gerar nome do arquivo com data
        const hoje = new Date();
        const dataArquivo = `${hoje.getDate().toString().padStart(2, '0')}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}-${hoje.getFullYear()}`;
        const nomeArquivo = `Produtos_${dataArquivo}.xlsx`;

        // Exportar
        XLSX.writeFile(wb, nomeArquivo);
        alert('✓ Produtos exportados com sucesso!\nArquivo: ' + nomeArquivo);
    }

    function abrirImportacaoXLSX() {
        document.getElementById('inputImportarXLSX').click();
    }

    function importarProdutosXLSX(event) {
        const arquivo = event.target.files[0];
        if (!arquivo) {
            return;
        }

        const leitor = new FileReader();
        leitor.onload = function(e) {
            try {
                const dados = new Uint8Array(e.target.result);
                const workbook = XLSX.read(dados, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const dadosJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (dadosJson.length === 0) {
                    alert('⚠️ Arquivo vazio ou sem dados válidos.');
                    return;
                }

                // Validar e mapear as colunas
                let produtosImportados = 0;
                let erros = [];

                dadosJson.forEach((linha, idx) => {
                    try {
                        // Norma os nomes das colunas (remove espaços em branco)
                        const linhaLimpa = {};
                        Object.keys(linha).forEach(key => {
                            linhaLimpa[key.trim()] = linha[key];
                        });

                        // Mapear colunas do Excel para formato do sistema
                        const prod = {
                            cod: (linhaLimpa['Código'] || '').toString().trim() || `IMPORT-${idx + 1}`,
                            data: (linhaLimpa['Data'] || new Date().toISOString().split('T')[0]).toString().trim(),
                            desc: (linhaLimpa['Descrição'] || '').toString().trim(),
                            unidade: (linhaLimpa['Unidade'] || 'unid').toString().trim(),
                            custo: parseFloat(linhaLimpa['Custo'] || 0) || 0,
                            margem: parseFloat(linhaLimpa['Margem (%)'] || 0) || 0,
                            venda: parseFloat(linhaLimpa['Valor Venda'] || 0) || 0,
                            estoque: parseFloat(linhaLimpa['Estoque'] || 0) || 0,
                            estoqueAtual: parseFloat(linhaLimpa['Estoque'] || 0) || 0
                        };

                        // Validações obrigatórias
                        if (!prod.desc) {
                            erros.push(`Linha ${idx + 2}: Descrição do produto é obrigatória.`);
                            return;
                        }

                        produtos.push(prod);
                        produtosImportados++;
                    } catch (erro) {
                        erros.push(`Linha ${idx + 2}: ${erro.message}`);
                    }
                });

                if (produtosImportados > 0) {
                    localStorage.setItem('produtos', JSON.stringify(produtos));
                    atualizarTabelaProduto();
                    alert(`✓ Importação concluída!\n✓ ${produtosImportados} produto(s) importado(s) com sucesso!${erros.length > 0 ? '\n\n⚠️ Erros:\n' + erros.slice(0, 5).join('\n') + (erros.length > 5 ? '\n... e mais' : '') : ''}`);
                } else {
                    alert(`❌ Nenhum produto foi importado.\n\nErros:\n${erros.join('\n')}`);
                }
            } catch (erro) {
                alert(`❌ Erro ao ler o arquivo XLSX:\n${erro.message}`);
            } finally {
                // Limpar o input para permitir nova importação do mesmo arquivo
                event.target.value = '';
            }
        };

        leitor.readAsArrayBuffer(arquivo);
    }

    // Funções para Pedido
    function limparPedido() {
        document.getElementById('pDataIni').value = '';
        document.getElementById('pDataFin').value = '';
        document.getElementById('pCod').value = '';
        document.getElementById('pCliente').value = '';
        document.getElementById('pStatus').value = 'Aberto';
        document.getElementById('pQtd').value = '';
        document.getElementById('pVUnit').value = '';
        document.getElementById('pTotal').value = '';
        document.getElementById('pEntrada').value = '';
        document.getElementById('pRestante').value = '';
        desabilitarCamposPedido();
    }

    function novoPedido() {
        limparPedido();
        pedidoSelecionado = null;
        emEdicaoPedido = false;
        
        // Remover destaque da tabela
        const linhas = document.querySelectorAll('#screen-pedido .erp-tabela tbody tr');
        linhas.forEach(linha => {
            linha.style.backgroundColor = '';
            linha.style.fontWeight = 'normal';
        });
        
        // Gerar código automático sequencial
        const proximoCod = 'PED' + String(pedidos.length + 1).padStart(4, '0');
        document.getElementById('pCod').value = proximoCod;
        document.getElementById('pDataIni').value = new Date().toISOString().split('T')[0];
        
        // Habilitar campos para edição
        document.getElementById('pDataIni').removeAttribute('readonly');
        document.getElementById('pDataFin').removeAttribute('readonly');
        document.getElementById('pCliente').removeAttribute('readonly');
        document.getElementById('pStatus').disabled = false;
        document.getElementById('pQtd').removeAttribute('readonly');
        document.getElementById('pVUnit').removeAttribute('readonly');
        document.getElementById('pEntrada').removeAttribute('readonly');
    }

    function cadastrarPedido() {
        const cliente = document.getElementById('pCliente').value.trim();
        const dataFin = document.getElementById('pDataFin').value;
        const qtd = document.getElementById('pQtd').value;
        const vUnit = document.getElementById('pVUnit').value;
        
        if (!cliente) {
            alert('Digite o nome do cliente!');
            document.getElementById('pCliente').focus();
            return;
        }
        if (!dataFin) {
            alert('Selecione a data de entrega!');
            return;
        }
        if (!qtd || qtd <= 0) {
            alert('Digite uma quantidade valida!');
            return;
        }
        if (!vUnit || vUnit <= 0) {
            alert('Digite um valor unitario valido!');
            return;
        }
        
        const pedido = {
            cod: document.getElementById('pCod').value,
            dataIni: document.getElementById('pDataIni').value,
            dataFin: dataFin,
            cliente: cliente,
            status: document.getElementById('pStatus').value,
            qtd: parseFloat(qtd),
            vUnit: parseFloat(vUnit),
            total: document.getElementById('pTotal').value,
            entrada: document.getElementById('pEntrada').value,
            restante: document.getElementById('pRestante').value
        };
        pedidos.push(pedido);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        atualizarTabelaPedido();
        alert('Pedido Registrado!\nCodigo: ' + pedido.cod);
        novoPedido();
        pedidoSelecionado = null;
    }

    function atualizarTabelaPedido() {
        const tbody = document.querySelector('#screen-pedido .erp-tabela tbody');
        tbody.innerHTML = '';
        pedidos.forEach((p, idx) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-index', idx);
            tr.style.cursor = 'pointer';
            tr.style.transition = 'all 0.2s';
            tr.innerHTML = `<td>${p.cod}</td><td>${p.dataIni}</td><td>${p.dataFin}</td><td>${p.cliente}</td><td>${p.status}</td><td>${p.qtd}</td><td>${p.total}</td><td>${p.entrada}</td><td>${p.restante}</td>`;
            
            // Evento de clique com callback seguro
            tr.addEventListener('click', function() {
                selecionarPedido(idx);
            });
            
            // Hover effect
            tr.addEventListener('mouseenter', function() {
                if (pedidoSelecionado !== idx) {
                    this.style.backgroundColor = '#f0f0f0';
                }
            });
            tr.addEventListener('mouseleave', function() {
                if (pedidoSelecionado !== idx) {
                    this.style.backgroundColor = '';
                }
            });
            
            tbody.appendChild(tr);
        });
    }

    function pesquisarPedido() {
        const termo = prompt('Digite o código ou cliente do pedido:');
        if (termo) {
            const resultados = pedidos.filter(p => p.cliente.toLowerCase().includes(termo.toLowerCase()) || p.cod.toLowerCase().includes(termo.toLowerCase()));
            const tbody = document.querySelector('#screen-pedido .erp-tabela tbody');
            tbody.innerHTML = '';
            resultados.forEach((p) => {
                const tr = document.createElement('tr');
                const idx = pedidos.indexOf(p);
                tr.setAttribute('data-index', idx);
                tr.style.cursor = 'pointer';
                tr.style.transition = 'all 0.2s';
                tr.innerHTML = `<td>${p.cod}</td><td>${p.dataIni}</td><td>${p.dataFin}</td><td>${p.cliente}</td><td>${p.status}</td><td>${p.qtd}</td><td>${p.total}</td><td>${p.entrada}</td><td>${p.restante}</td>`;
                
                // Evento de clique com callback seguro
                tr.addEventListener('click', function() {
                    selecionarPedido(idx);
                });
                
                // Hover effect
                tr.addEventListener('mouseenter', function() {
                    if (pedidoSelecionado !== idx) {
                        this.style.backgroundColor = '#f0f0f0';
                    }
                });
                tr.addEventListener('mouseleave', function() {
                    if (pedidoSelecionado !== idx) {
                        this.style.backgroundColor = '';
                    }
                });
                
                tbody.appendChild(tr);
            });
            
            if (resultados.length === 0) {
                alert('Nenhum pedido encontrado!');
                atualizarTabelaPedido();
            }
        } else {
            atualizarTabelaPedido();
        }
    }

    let pedidoSelecionado = null;
    let emEdicaoPedido = false;

    function selecionarPedido(idx) {
        pedidoSelecionado = idx;
        const p = pedidos[idx];
        
        // Desabilitar campos de edição até clicar em "Habilitar Edição"
        desabilitarCamposPedido();
        
        // Carregar dados do pedido nos campos
        document.getElementById('pCod').value = p.cod;
        document.getElementById('pDataIni').value = p.dataIni;
        document.getElementById('pDataFin').value = p.dataFin;
        document.getElementById('pCliente').value = p.cliente;
        document.getElementById('pStatus').value = p.status;
        document.getElementById('pQtd').value = p.qtd;
        document.getElementById('pVUnit').value = p.vUnit;
        document.getElementById('pTotal').value = p.total;
        document.getElementById('pEntrada').value = p.entrada;
        document.getElementById('pRestante').value = p.restante;
        
        // Destaque visual na tabela
        const tabela = document.querySelector('#screen-pedido .erp-tabela tbody');
        const linhas = tabela.querySelectorAll('tr');
        linhas.forEach((linha, indice) => {
            if (indice === idx) {
                linha.style.backgroundColor = '#fff3cd';
                linha.style.fontWeight = 'bold';
            } else {
                linha.style.backgroundColor = '';
                linha.style.fontWeight = 'normal';
            }
        });
        
        console.log('✓ Pedido selecionado:', p.cod);
    }

    function enableEdicaoPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para editar!');
            return;
        }
        
        // Remover readonly e habilitar campos
        document.getElementById('pDataIni').removeAttribute('readonly');
        document.getElementById('pDataFin').removeAttribute('readonly');
        document.getElementById('pCliente').removeAttribute('readonly');
        document.getElementById('pStatus').disabled = false;
        document.getElementById('pQtd').removeAttribute('readonly');
        document.getElementById('pVUnit').removeAttribute('readonly');
        document.getElementById('pEntrada').removeAttribute('readonly');
        
        emEdicaoPedido = true;
        alert('Campos habilitados para edição!');
    }

    function salvarEdicaoPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para editar!');
            return;
        }
        if (!emEdicaoPedido) {
            alert('Clique em "Habilitar Edição" primeiro!');
            return;
        }
        
        const p = pedidos[pedidoSelecionado];
        p.dataIni = document.getElementById('pDataIni').value;
        p.dataFin = document.getElementById('pDataFin').value;
        p.cliente = document.getElementById('pCliente').value;
        p.status = document.getElementById('pStatus').value;
        p.qtd = document.getElementById('pQtd').value;
        p.vUnit = document.getElementById('pVUnit').value;
        p.total = document.getElementById('pTotal').value;
        p.entrada = document.getElementById('pEntrada').value;
        p.restante = document.getElementById('pRestante').value;
        
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        
        // Desabilitar campos novamente
        desabilitarCamposPedido();
        atualizarTabelaPedido();
        alert('Pedido atualizado com sucesso!');
        novoPedido();
        pedidoSelecionado = null;
        emEdicaoPedido = false;
    }

    function desabilitarCamposPedido() {
        document.getElementById('pDataIni').disabled = true;
        document.getElementById('pDataFin').disabled = true;
        document.getElementById('pCliente').disabled = true;
        document.getElementById('pStatus').disabled = true;
        document.getElementById('pQtd').disabled = true;
        document.getElementById('pVUnit').disabled = true;
        document.getElementById('pEntrada').disabled = true;
        emEdicaoPedido = false;
    }

    function excluirPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para excluir!');
            return;
        }
        const p = pedidos[pedidoSelecionado];
        if (confirm('Tem certeza que deseja deletar o pedido ' + p.cod + '?')) {
            pedidos.splice(pedidoSelecionado, 1);
            localStorage.setItem('pedidos', JSON.stringify(pedidos));
            atualizarTabelaPedido();
            alert('Pedido deletado!');
            novoPedido();
            pedidoSelecionado = null;
        }
    }

    function finalizarPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para finalizar!');
            return;
        }
        const p = pedidos[pedidoSelecionado];
        p.status = 'Finalizado';
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        atualizarTabelaPedido();
        alert('Pedido foi finalizado!');
        novoPedido();
        pedidoSelecionado = null;
    }

    function imprimirPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para imprimir!');
            return;
        }
        const p = pedidos[pedidoSelecionado];
        const conteudo = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Pedido ${p.cod}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .header h2 { margin: 0; }
                    .info { margin: 10px 0; }
                    .label { font-weight: bold; }
                    .linha { border-bottom: 1px dotted #ccc; padding: 8px 0; }
                    @media print { body { margin: 0; padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>PEDIDO DE ENCOMENDA</h2>
                    <p>Código: ${p.cod}</p>
                </div>
                <div class="info linha"><span class="label">Cliente:</span> ${p.cliente}</div>
                <div class="info linha"><span class="label">Data Inicial:</span> ${p.dataIni}</div>
                <div class="info linha"><span class="label">Data Entrega:</span> ${p.dataFin}</div>
                <div class="info linha"><span class="label">Status:</span> ${p.status}</div>
                <div class="info linha"><span class="label">Quantidade:</span> ${p.qtd}</div>
                <div class="info linha"><span class="label">Valor Unitário:</span> R$ ${parseFloat(p.vUnit).toFixed(2)}</div>
                <div class="info linha"><span class="label">Total:</span> R$ ${parseFloat(p.total).toFixed(2)}</div>
                <div class="info linha"><span class="label">Entrada (50%):</span> R$ ${parseFloat(p.entrada).toFixed(2)}</div>
                <div class="info linha"><span class="label">Restante:</span> R$ ${parseFloat(p.restante).toFixed(2)}</div>
                <div style="margin-top: 30px; text-align: center;">
                    <p>_________________________</p>
                    <p>Assinatura</p>
                </div>
            </body>
            </html>
        `;
        const janela = window.open('', '', 'width=800,height=600');
        janela.document.write(conteudo);
        janela.document.close();
        setTimeout(() => {
            janela.print();
        }, 250);
    }

    function gerarPDFPedido() {
        if (pedidoSelecionado === null) {
            alert('Clique em um pedido na tabela para gerar PDF!');
            return;
        }
        const p = pedidos[pedidoSelecionado];
        
        // Verificar se html2pdf está disponível
        if (typeof html2pdf === 'undefined') {
            alert('Biblioteca PDF não carregada. Usando impressão alternativa...');
            imprimirPedido();
            return;
        }
        
        const elemento = document.createElement('div');
        elemento.innerHTML = `
            <div style="padding: 20px; font-family: Arial; background: white;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                    <h2 style="margin: 0;">PEDIDO DE ENCOMENDA</h2>
                    <p style="margin: 5px 0;">Código: ${p.cod}</p>
                </div>
                <div style="margin: 10px 0;"><strong>Cliente:</strong> ${p.cliente}</div>
                <div style="margin: 10px 0;"><strong>Data Inicial:</strong> ${p.dataIni}</div>
                <div style="margin: 10px 0;"><strong>Data Entrega:</strong> ${p.dataFin}</div>
                <div style="margin: 10px 0;"><strong>Status:</strong> ${p.status}</div>
                <div style="margin: 10px 0;"><strong>Quantidade:</strong> ${p.qtd}</div>
                <div style="margin: 10px 0;"><strong>Valor Unitário:</strong> R$ ${parseFloat(p.vUnit).toFixed(2)}</div>
                <div style="margin: 10px 0; border-top: 2px solid #000; padding-top: 10px;"><strong>Total:</strong> R$ ${parseFloat(p.total).toFixed(2)}</div>
                <div style="margin: 10px 0;"><strong>Entrada (50%):</strong> R$ ${parseFloat(p.entrada).toFixed(2)}</div>
                <div style="margin: 10px 0;"><strong>Restante:</strong> R$ ${parseFloat(p.restante).toFixed(2)}</div>
                <div style="margin-top: 40px; text-align: center;">
                    <p>_________________________</p>
                    <p>Assinatura</p>
                </div>
            </div>
        `;
        
        const opt = {
            margin: 10,
            filename: `Pedido_${p.cod}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(elemento).save();
    }

    // Inicializar tabelas ao carregar
    window.onload = function() {
        atualizarTabelaCliente();
        atualizarTabelaProduto();
        atualizarTabelaPedido();
        initTotais();
        initFecharCaixa();
        atualizarTabelaEstoque();
        initCaixa();
        carregarUnidades();
        carregarProdutosDoBanco();
    };

    // --- ESTOQUE ---
    function atualizarTabelaEstoque(filtro = "") {
        const tbody = document.querySelector('#tabelaEstoque tbody');
        tbody.innerHTML = '';
        let estoqueGeral = 0;
        let financeiroGeral = 0;
        produtos.forEach(p => {
            if (filtro && !(p.desc.toLowerCase().includes(filtro.toLowerCase()) || p.cod.toLowerCase().includes(filtro.toLowerCase()))) return;
            const estoque = parseFloat(p.estoque) || 0;
            const saida = parseFloat(p.saida) || 0;
            const estoqueAtual = estoque - saida;
            const estoqueMinimo = parseFloat(p.estoqueMinimo) || 0;
            const valorVenda = parseFloat(p.venda) || 0;
            const estoqueFinanceiro = estoqueAtual * valorVenda;
            estoqueGeral += estoqueAtual;
            financeiroGeral += estoqueFinanceiro;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.desc}</td>
                <td>${p.unidade}</td>
                <td>${estoque}</td>
                <td>${saida}</td>
                <td>${estoqueAtual}</td>
                <td>${estoqueMinimo}</td>
                <td>R$ ${estoqueFinanceiro.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('estoqueGeral').innerText = estoqueGeral.toLocaleString('pt-BR', {minimumFractionDigits:2});
        document.getElementById('financeiroGeral').innerText = 'R$ ' + financeiroGeral.toLocaleString('pt-BR', {minimumFractionDigits:2});
    }

    function pesquisarProdutoEstoque() {
        const termo = document.getElementById('estoqueBuscaProduto').value;
        atualizarTabelaEstoque(termo);
    }

    // --- LÓGICA FECHAR CAIXA ---
    function initFecharCaixa() {
        document.getElementById('fechDinheiro').innerText = `R$ ${dadosTotais.Dinheiro.toFixed(2)}`;
        document.getElementById('fechDebito').innerText = `R$ ${dadosTotais['Cartão Débito'].toFixed(2)}`;
        document.getElementById('fechCredito').innerText = `R$ ${dadosTotais['Cartão Crédito'].toFixed(2)}`;
        document.getElementById('fechPix').innerText = `R$ ${dadosTotais.Pix.toFixed(2)}`;
        document.getElementById('fechCrediario').innerText = `R$ ${dadosTotais.Crediario.toFixed(2)}`;
    }

    // --- LÓGICA TOTAIS EM CAIXA ---
    const totaisIniciais = {
        Dinheiro: 0,
        'Cartão Débito': 0,
        'Cartão Crédito': 0,
        Pix: 0,
        Crediario: 0
    };
    let dadosTotais = { ...totaisIniciais, ...JSON.parse(localStorage.getItem('dadosTotais') || '{}') };
    let detalhesTotais = JSON.parse(localStorage.getItem('detalhesTotais') || '[]');
    let caixaAberto = localStorage.getItem('caixaAberto') !== 'false';
    let saldoInicialCaixa = Number(localStorage.getItem('saldoInicialCaixa') || 0);
    let chart;

    function atualizarStatusCaixa() {
        const status = document.getElementById('statusCaixa');
        if (!status) return;
        status.innerText = caixaAberto ? 'Caixa aberto' : 'Caixa fechado';
        status.style.color = caixaAberto ? '#2e7d32' : '#c62828';
    }

    function abrirCaixa() {
        if (caixaAberto) {
            alert('O caixa já está aberto.');
            return;
        }
        const valor = prompt('Informe o valor inicial do caixa (opcional):', '0');
        if (valor === null) return;
        const valorInicial = Number(String(valor).replace(',', '.'));
        if (!Number.isFinite(valorInicial) || valorInicial < 0) {
            alert('Informe um valor inicial válido.');
            return;
        }
        saldoInicialCaixa = valorInicial;
        caixaAberto = true;
        localStorage.setItem('caixaAberto', 'true');
        localStorage.setItem('saldoInicialCaixa', String(saldoInicialCaixa));
        atualizarStatusCaixa();
        alert(`Caixa aberto com saldo inicial de R$ ${saldoInicialCaixa.toFixed(2)}.`);
    }

    function initTotais() {
        document.getElementById('dataTotais').innerText = new Date().toLocaleDateString('pt-BR');
        document.getElementById('totalDinheiro').innerText = `R$ ${dadosTotais.Dinheiro.toFixed(2)}`;
        document.getElementById('totalDebito').innerText = `R$ ${dadosTotais['Cartão Débito'].toFixed(2)}`;
        document.getElementById('totalCredito').innerText = `R$ ${dadosTotais['Cartão Crédito'].toFixed(2)}`;
        document.getElementById('totalPix').innerText = `R$ ${dadosTotais.Pix.toFixed(2)}`;
        document.getElementById('totalCrediario').innerText = `R$ ${dadosTotais.Crediario.toFixed(2)}`;
    }

    function mostrarGrafico(forma) {
        const ctx = document.getElementById('graficoTotais').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(dadosTotais),
                datasets: [{
                    label: 'Valores (R$)',
                    data: Object.values(dadosTotais),
                    backgroundColor: ['#f57c00', '#263238', '#90a4ae', '#36a2eb', '#ffce56'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Gráfico de formas de pagamento - ${forma}`
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }

    function mostrarDetalhes() {
        const area = document.getElementById('areaDetalhes');
        area.style.display = area.style.display === 'none' ? 'block' : 'none';
        if (area.style.display === 'block') {
            const tbody = document.getElementById('tbodyDetalhes');
            tbody.innerHTML = '';
            detalhesTotais.forEach(d => {
                tbody.innerHTML += `<tr><td>${d.data}</td><td>${d.forma}</td><td>R$ ${d.valor.toFixed(2)}</td><td>${d.desc}</td></tr>`;
            });
        }
    }

    function imprimirTotais() {
        window.print();
    }

    function exportarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Totais em Caixa', 10, 10);
        doc.text(`Data: ${document.getElementById('dataTotais').innerText}`, 10, 20);
        let y = 30;
        Object.entries(dadosTotais).forEach(([k, v]) => {
            doc.text(`${k}: R$ ${v.toFixed(2)}`, 10, y);
            y += 10;
        });
        doc.save('totais_caixa.pdf');
    }

    let relatorioChart = null;

    function initRelatorios() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('relatorioData').value = today;
        mostrarRelatorio('extrato');
    }

    function initCatalogo() {
        const imagens = JSON.parse(localStorage.getItem('catalogoImagens') || '[]');
        const aviso = document.getElementById('catalogoAviso');
        if (imagens.length === 0) {
            aviso.innerText = 'Nenhuma imagem carregada ainda. Clique em "Carregar imagem" para adicionar até 50 itens.';
        } else {
            aviso.innerText = `Total de imagens: ${imagens.length} (máx. 50).`;    
        }
        renderCatalogo(imagens);
    }

    function initBackup() {
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('backupData').value = hoje;
        verificarBackupAutomatico();
        renderBackupHistory();
    }

    function verificarBackupAutomatico() {
        const ultima = localStorage.getItem('ultimoBackupAutomatico');
        const hoje = new Date().toISOString().split('T')[0];
        if (ultima === hoje) return;
        fazerBackup(true);
        localStorage.setItem('ultimoBackupAutomatico', hoje);
    }

    function initConfiguracoes() {
        showConfigTab('empresa');
        carregarDadosEmpresa();
        carregarUsuarios();
        carregarRestricoes();
        carregarImpressora();
        carregarFornecedores();
        carregarUnidades();
        carregarPix();
    }

    function showConfigTab(tab) {
        document.querySelectorAll('.config-menu button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.config-section').forEach(sec => sec.style.display = 'none');
        document.getElementById('tab-' + tab).classList.add('active');
        document.getElementById('panel-' + tab).style.display = 'block';
        if (tab === 'impressora') carregarImpressoras();
    }

    // Empresa
    function carregarDadosEmpresa() {
        const dados = JSON.parse(localStorage.getItem('empresaDados') || '{}');
        ['Razao','Fantasia','CNPJ','IE','CEP','Logradouro','Numero','Complemento','Bairro','Cidade','UF','ContatoNome','ContatoTel'].forEach(key => {
            const el = document.getElementById('empresa' + key);
            if (el) el.value = dados[key.toLowerCase()] || '';
        });
    }

    function salvarEmpresa() {
        const dados = {
            razao: document.getElementById('empresaRazao').value,
            fantasia: document.getElementById('empresaFantasia').value,
            cnpj: document.getElementById('empresaCNPJ').value,
            ie: document.getElementById('empresaIE').value,
            cep: document.getElementById('empresaCEP').value,
            logradouro: document.getElementById('empresaLogradouro').value,
            numero: document.getElementById('empresaNumero').value,
            complemento: document.getElementById('empresaComplemento').value,
            bairro: document.getElementById('empresaBairro').value,
            cidade: document.getElementById('empresaCidade').value,
            uf: document.getElementById('empresaUF').value,
            contatonome: document.getElementById('empresaContatoNome').value,
            contatotel: document.getElementById('empresaContatoTel').value
        };
        localStorage.setItem('empresaDados', JSON.stringify(dados));
        alert('Dados da empresa salvos.');
    }

    function limparEmpresa() {
        ['Razao','Fantasia','CNPJ','IE','CEP','Logradouro','Numero','Complemento','Bairro','Cidade','UF','ContatoNome','ContatoTel'].forEach(key => {
            const el = document.getElementById('empresa' + key);
            if (el) el.value = '';
        });
    }

    // Usuários
    function carregarUsuarios() {
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const tbody = document.querySelector('#usuarioTable tbody');
        tbody.innerHTML = '';
        usuarios.forEach((u, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${u.nome}</td><td>${u.login}</td><td>${u.perfil}</td><td><button onclick="editarUsuario(${idx})">Editar</button> <button onclick="excluirUsuario(${idx})">Excluir</button></td>`;
            tbody.appendChild(tr);
        });
    }

    function salvarUsuario() {
        const nome = document.getElementById('usuarioNome').value;
        const login = document.getElementById('usuarioLogin').value;
        const senha = document.getElementById('usuarioSenha').value;
        const conf = document.getElementById('usuarioSenhaConf').value;
        const perfil = document.querySelector('input[name="usuarioPerfil"]:checked').value;
        const id = document.getElementById('usuarioID').value;
        
        if (!nome || !login || !senha) { alert('Preencha nome, login e senha.'); return; }
        if (senha !== conf) { alert('Senhas não conferem.'); return; }
        
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        
        if (id) {
            // Editar
            usuarios[parseInt(id)] = { nome, login, senha, perfil };
            alert('Usuário atualizado.');
        } else {
            // Novo
            usuarios.push({ nome, login, senha, perfil });
            alert('Usuário salvo.');
        }
        
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarUsuarios();
        limparUsuario();
    }

    function editarUsuario(idx) {
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const u = usuarios[idx];
        document.getElementById('usuarioID').value = idx;
        document.getElementById('usuarioNome').value = u.nome;
        document.getElementById('usuarioLogin').value = u.login;
        document.getElementById('usuarioSenha').value = u.senha;
        document.getElementById('usuarioSenhaConf').value = u.senha;
        document.querySelector(`input[name="usuarioPerfil"][value="${u.perfil}"]`).checked = true;
    }

    function excluirUsuario(idx) {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            usuarios.splice(idx, 1);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            carregarUsuarios();
        }
    }

    function removerUsuario(idx) {
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        usuarios.splice(idx, 1);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarUsuarios();
    }

    function limparUsuario() {
        document.getElementById('usuarioID').value = '';
        document.getElementById('usuarioNome').value = '';
        document.getElementById('usuarioLogin').value = '';
        document.getElementById('usuarioSenha').value = '';
        document.getElementById('usuarioSenhaConf').value = '';
        document.querySelector('input[name="usuarioPerfil"]').checked = true;
    }

    function atualizarUsuario() {
        const id = document.getElementById('usuarioID').value;
        if (!id) { alert('Selecione um usuário para editar (clique em Editar na tabela).'); return; }
        salvarUsuario();
    }

    function deletarUsuarioAtual() {
        const id = document.getElementById('usuarioID').value;
        if (!id) { alert('Selecione um usuário para excluir (clique em Editar na tabela).'); return; }
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            excluirUsuario(parseInt(id));
            limparUsuario();
        }
    }

    // Restrições
    function carregarRestricoes() {
        const restr = JSON.parse(localStorage.getItem('restricoes') || '{}');
        document.getElementById('restricaoCancelarItens').checked = !!restr.cancelar;
        document.getElementById('restricaoVendas').checked = !!restr.vendas;
        document.getElementById('restricaoPagamentos').checked = !!restr.pagamentos;
    }

    function salvarRestricoes() {
        const restr = {
            cancelar: document.getElementById('restricaoCancelarItens').checked,
            vendas: document.getElementById('restricaoVendas').checked,
            pagamentos: document.getElementById('restricaoPagamentos').checked
        };
        localStorage.setItem('restricoes', JSON.stringify(restr));
        alert('Restrições salvas.');
    }

    // Impressora
    function carregarImpressora() {
        const imp = JSON.parse(localStorage.getItem('impressora') || '{}');
        document.getElementById('impNomeManual').value = imp.nome || '';
        document.getElementById('impPorta').value = imp.porta || '';
        document.getElementById('impTipo').value = imp.tipo || 'normal';
        carregarImpressoras(imp.nome);
    }

    async function carregarImpressoras(nomeSelecionado = '') {
        const select = document.getElementById('impNome');
        const status = document.getElementById('impStatus');
        if (!select || !status) return;

        status.textContent = 'Consultando impressoras instaladas...';
        try {
            const resposta = await fetch('/api/printers');
            if (!resposta.ok) throw new Error('Falha ao consultar impressoras');
            const dados = await resposta.json();
            select.innerHTML = '<option value="">Selecione uma impressora</option>';
            dados.printers.forEach(printer => {
                const option = document.createElement('option');
                option.value = printer.Name || '';
                option.textContent = printer.Default ? `${printer.Name} (padrão)` : printer.Name;
                option.dataset.porta = printer.PortName || '';
                option.dataset.driver = printer.DriverName || '';
                select.appendChild(option);
            });
            select.value = nomeSelecionado || '';
            if (select.value) selecionarImpressora();
            status.textContent = dados.printers.length
                ? `${dados.printers.length} impressora(s) encontrada(s).`
                : (dados.message || 'Nenhuma impressora encontrada.');
        } catch (error) {
            status.textContent = 'Não foi possível listar automaticamente. Use o campo manual abaixo.';
        }
    }

    function selecionarImpressora() {
        const select = document.getElementById('impNome');
        const option = select.options[select.selectedIndex];
        if (!option || !option.value) return;
        document.getElementById('impNomeManual').value = option.value;
        document.getElementById('impPorta').value = option.dataset.porta || '';
    }

    function salvarImpressora() {
        const imp = {
            nome: document.getElementById('impNomeManual').value || document.getElementById('impNome').value,
            porta: document.getElementById('impPorta').value,
            tipo: document.getElementById('impTipo').value
        };
        localStorage.setItem('impressora', JSON.stringify(imp));
        alert('Configuração de impressora salva.');
    }

    // Fornecedores
    function carregarFornecedores() {
        const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
        const tbody = document.querySelector('#fornecedorTable tbody');
        tbody.innerHTML = '';
        fornecedores.forEach((f, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${f.fantasia}</td><td>${f.cnpj}</td><td>${f.telefone}</td><td><button onclick="removerFornecedor(${idx})">Excluir</button></td>`;
            tbody.appendChild(tr);
        });
    }

    function salvarFornecedor() {
        const fornecedor = {
            fantasia: document.getElementById('fornFantasia').value,
            razao: document.getElementById('fornRazao').value,
            cnpj: document.getElementById('fornCNPJ').value,
            ie: document.getElementById('fornIE').value,
            telefone: document.getElementById('fornTel').value,
            cep: document.getElementById('fornCEP').value,
            logradouro: document.getElementById('fornLogradouro').value,
            numero: document.getElementById('fornNumero').value,
            complemento: document.getElementById('fornComplemento').value,
            bairro: document.getElementById('fornBairro').value,
            cidade: document.getElementById('fornCidade').value,
            uf: document.getElementById('fornUF').value
        };
        const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
        fornecedores.push(fornecedor);
        localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
        carregarFornecedores();
        alert('Fornecedor salvo.');
    }

    function limparFornecedor() {
        ['fornFantasia','fornRazao','fornCNPJ','fornIE','fornTel','fornCEP','fornLogradouro','fornNumero','fornComplemento','fornBairro','fornCidade','fornUF'].forEach(id => document.getElementById(id).value = '');
    }

    function removerFornecedor(idx) {
        const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
        fornecedores.splice(idx, 1);
        localStorage.setItem('fornecedores', JSON.stringify(fornecedores));
        carregarFornecedores();
    }

    // Unidade de medida
    function carregarUnidades() {
        const unidades = JSON.parse(localStorage.getItem('unidades') || '[]');
        const tbody = document.querySelector('#unidadeTable tbody');
        if (tbody) {
            tbody.innerHTML = '';
            unidades.forEach((u, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${u}</td><td><button onclick="removerUnidade(${idx})">Excluir</button></td>`;
                tbody.appendChild(tr);
            });
        }
        atualizarUnidadesProduto(unidades);
    }

    function atualizarUnidadesProduto(unidades = JSON.parse(localStorage.getItem('unidades') || '[]')) {
        const select = document.getElementById('prodUnidade');
        if (!select) return;

        const valorAtual = select.value || 'unid';
        const opcoes = ['unid', ...unidades.map(unidade => String(unidade).trim()).filter(Boolean)]
            .filter((unidade, idx, lista) => lista.findIndex(item => item.toLowerCase() === unidade.toLowerCase()) === idx);

        select.innerHTML = '';
        opcoes.forEach(unidade => {
            const option = document.createElement('option');
            option.value = unidade;
            option.textContent = unidade;
            select.appendChild(option);
        });

        if (!opcoes.some(unidade => unidade.toLowerCase() === valorAtual.toLowerCase())) {
            const option = document.createElement('option');
            option.value = valorAtual;
            option.textContent = valorAtual;
            select.appendChild(option);
        }
        select.value = valorAtual;
    }

    function salvarUnidade() {
        const nome = document.getElementById('unidadeNome').value;
        if (!nome) { alert('Informe o nome da unidade.'); return; }
        const unidades = JSON.parse(localStorage.getItem('unidades') || '[]');
        if (unidades.some(unidade => unidade.toLowerCase() === nome.trim().toLowerCase())) {
            alert('Esta unidade já está cadastrada.');
            return;
        }
        unidades.push(nome.trim());
        localStorage.setItem('unidades', JSON.stringify(unidades));
        carregarUnidades();
        alert('Unidade salva.');
    }

    function limparUnidade() {
        document.getElementById('unidadeNome').value = '';
    }

    function removerUnidade(idx) {
        const unidades = JSON.parse(localStorage.getItem('unidades') || '[]');
        unidades.splice(idx, 1);
        localStorage.setItem('unidades', JSON.stringify(unidades));
        carregarUnidades();
    }

    // Pix
    function carregarPix() {
        const chaves = JSON.parse(localStorage.getItem('pixChaves') || '[]');
        const table = document.getElementById('pixTable');
        
        if (!table) {
            console.error('Tabela pixTable não encontrada');
            return;
        }
        
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.error('tbody não encontrado em pixTable');
            return;
        }
        
        tbody.innerHTML = '';
        chaves.forEach((p, idx) => {
            const tr = document.createElement('tr');
            const qrCell = p.qrCode ? `<img src="${p.qrCode}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" />` : 'N/A';
            tr.innerHTML = `<td>${p.nome}</td><td>${p.chave}</td><td>${p.tipo}</td><td>${qrCell}</td><td><button onclick="removerPix(${idx})">Excluir</button></td>`;
            tbody.appendChild(tr);
        });
    }

   function salvarPix() {
    const inputQr = document.getElementById('pixInputFile'); // ID Novo!
    const nome = document.getElementById('pixNome').value;
    const chave = document.getElementById('pixChave').value;
    const tipo = document.getElementById('pixTipo').value;
    
    if (!nome || !chave) {
        alert("Preencha o nome e a chave!");
        return;
    }

    const qrFile = inputQr.files[0];
    const pix = { nome, chave, tipo };

    if (qrFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Se quiser compactar a imagem aqui é o ideal (usando o canvas que mandei antes)
            pix.qrCode = e.target.result;
            salvarPixNoStorage(pix);
        };
        reader.readAsDataURL(qrFile);
    } else {
        salvarPixNoStorage(pix);
    }
}

    function salvarPixNoStorage(pix) {
        try {
            const chaves = JSON.parse(localStorage.getItem('pixChaves') || '[]');
            chaves.push(pix);
            localStorage.setItem('pixChaves', JSON.stringify(chaves));
            console.log('Chave Pix salva:', pix);
            carregarPix();
            limparPix();
            alert('Chave Pix salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar Pix:', error);
            alert('Erro ao salvar Pix: ' + error.message);
        }
    }

   function previewImagemPix(event) {
    // Se o 'event' for passado, usamos o alvo do evento. 
    // Se não, tentamos o ID (fallback).
    const input = event ? event.target : document.getElementById('pixQrCode');
    
    if (input && input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('pixQrImage');
            const previewDiv = document.getElementById('pixQrPreview');
            
            if (previewImg) previewImg.src = e.target.result;
            if (previewDiv) previewDiv.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

    function limparPix() {
        document.getElementById('pixNome').value = '';
        document.getElementById('pixChave').value = '';
        document.getElementById('pixTipo').value = 'CPF';
        document.getElementById('pixQrCode').value = '';
        document.getElementById('pixQrPreview').style.display = 'none';
    }

    function removerPix(idx) {
        const chaves = JSON.parse(localStorage.getItem('pixChaves') || '[]');
        chaves.splice(idx, 1);
        localStorage.setItem('pixChaves', JSON.stringify(chaves));
        carregarPix();
    }

    function fazerBackup(automatico = false) {
        const data = new Date();
        const backup = {
            dataGeracao: data.toISOString(),
            clientes: JSON.parse(localStorage.getItem('clientes') || '[]'),
            produtos: JSON.parse(localStorage.getItem('produtos') || '[]'),
            pedidos: JSON.parse(localStorage.getItem('pedidos') || '[]'),
            catalogoImagens: JSON.parse(localStorage.getItem('catalogoImagens') || '[]')
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const nomeArquivo = `backup_${data.toISOString().slice(0,10)}_${data.getHours()}${data.getMinutes()}${data.getSeconds()}.json`;

        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        registrarBackupHistorico(nomeArquivo, blob.size, automatico);
        document.getElementById('backupStatus').innerText = automatico ? 'Backup automático concluído.' : 'Backup concluído.';
        setTimeout(() => document.getElementById('backupStatus').innerText = '', 3000);
    }

    function registrarBackupHistorico(nome, tamanho, automatico) {
        const chave = 'backupHistory';
        const historico = JSON.parse(localStorage.getItem(chave) || '[]');
        const now = new Date();
        historico.unshift({
            id: Date.now() + Math.random(),
            data: now.toLocaleDateString('pt-BR'),
            hora: now.toLocaleTimeString('pt-BR'),
            tamanho: (tamanho / 1024).toFixed(2),
            arquivo: nome,
            automatico: !!automatico
        });
        localStorage.setItem(chave, JSON.stringify(historico.slice(0, 50)));
        renderBackupHistory();
    }

    function renderBackupHistory() {
        const body = document.getElementById('backupHistoryBody');
        const historico = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        body.innerHTML = '';
        if (!historico.length) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:12px;">Nenhum backup registrado ainda.</td></tr>';
            return;
        }
        historico.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="padding:8px;">${entry.data}</td><td style="padding:8px;">${entry.hora}</td><td style="padding:8px; text-align:right;">${entry.tamanho}</td><td style="padding:8px;">${entry.arquivo}${entry.automatico ? ' (auto)' : ''}</td>`;
            body.appendChild(tr);
        });
    }

    function restaurarBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const backup = JSON.parse(reader.result);
                localStorage.setItem('clientes', JSON.stringify(backup.clientes || []));
                localStorage.setItem('produtos', JSON.stringify(backup.produtos || []));
                localStorage.setItem('pedidos', JSON.stringify(backup.pedidos || []));
                localStorage.setItem('catalogoImagens', JSON.stringify(backup.catalogoImagens || []));
                initCatalogo();
                initBackup();
                document.getElementById('backupStatus').innerText = 'Backup restaurado com sucesso.';
                setTimeout(() => document.getElementById('backupStatus').innerText = '', 3000);
            } catch (err) {
                alert('Falha ao restaurar backup: arquivo inválido.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function adicionarImagensCatalogo(event) {
        const arquivos = Array.from(event.target.files || []);
        if (!arquivos.length) return;
        const chave = 'catalogoImagens';
        const imagens = JSON.parse(localStorage.getItem(chave) || '[]');
        const restantes = 50 - imagens.length;
        if (restantes <= 0) {
            alert('Limite de 50 imagens atingido. Exclua algumas para adicionar novas.');
            return;
        }

        const promessas = arquivos.slice(0, restantes).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve({ id: Date.now() + Math.random(), src: reader.result, nome: file.name });
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promessas).then(novas => {
            const todas = imagens.concat(novas);
            localStorage.setItem(chave, JSON.stringify(todas));
            initCatalogo();
        });

        // Limpa o input para permitir carregar novamente o mesmo arquivo se necessário
        event.target.value = '';
    }

    function renderCatalogo(imagens) {
        const grid = document.getElementById('catalogoGrid');
        grid.innerHTML = '';
        if (!imagens || imagens.length === 0) {
            grid.innerHTML = '<div class="catalogo-empty">Nenhuma imagem disponível.</div>';
            return;
        }

        imagens.forEach(img => {
            const item = document.createElement('div');
            item.className = 'catalogo-item';
            item.innerHTML = `
                <img src="${img.src}" alt="${img.nome || 'Imagem'}" />
                <button onclick="removerImagemCatalogo('${img.id}')">Excluir</button>
            `;
            grid.appendChild(item);
        });
    }

    function removerImagemCatalogo(id) {
        const chave = 'catalogoImagens';
        let imagens = JSON.parse(localStorage.getItem(chave) || '[]');
        imagens = imagens.filter(i => i.id.toString() !== id.toString());
        localStorage.setItem(chave, JSON.stringify(imagens));
        initCatalogo();
    }

    function mostrarRelatorio(tipo) {
        const titulo = document.getElementById('relatorioTitulo');
        const subtitulo = document.getElementById('relatorioSubtitulo');
        const chartCard = document.getElementById('relatorioChartCard');
        const table = document.getElementById('relatorioTable');
        const tableBody = document.getElementById('relatorioTableBody');
        subtitulo.innerText = '';
        if (tipo === 'extrato') {
            titulo.innerText = 'Extrato de vendas';
            chartCard.classList.add('relatorio-hidden');
            table.style.display = 'block';
            tableBody.innerHTML = '';
            const hoje = document.getElementById('relatorioData').value;
            const dataFormatada = hoje.split('-').reverse().join('/');
            const historico = JSON.parse(localStorage.getItem('historicoVendas') || '[]');
            const itensVendidos = historico
                .filter(venda => String(venda.data || '').startsWith(dataFormatada))
                .flatMap(venda => venda.itens || [])
                .map(item => ({
                    item: item.desc || 'Item sem descrição',
                    qtd: Number(item.qtd) || 0,
                    valor: (Number(item.qtd) || 0) * (Number(item.valor) || 0)
                }));

            if (itensVendidos.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px;">Nenhuma venda encontrada para esta data.</td></tr>';
            } else {
                itensVendidos.forEach(item => {
                    tableBody.innerHTML += `<tr><td>${escaparHtml(item.item)}</td><td style="text-align:center">${item.qtd}</td><td style="text-align:right">R$ ${item.valor.toFixed(2)}</td></tr>`;
                });
            }
            subtitulo.innerText = `Data: ${dataFormatada}`;
            return;
        }

        // Para as opções de gráfico, exibimos o canvas
        table.style.display = 'none';
        chartCard.classList.remove('relatorio-hidden');

        if (tipo === 'controlePedidos') {
            titulo.innerText = 'Controle de pedidos';
            subtitulo.innerText = 'Pedidos em aberto e concluídos';
            atualizarGraficoRelatorio([12, 8, 5, 3], ['Abertos', 'Concluídos', 'Cancelados', 'Em alteração'], 'pie');
            return;
        }

        if (tipo === 'balancoEstoque') {
            titulo.innerText = 'Balanço de estoque';
            subtitulo.innerText = 'Estoque atual x mínimo x máximo';
            atualizarGraficoRelatorio([120, 70, 30], ['Estoque Atual', 'Estoque Mínimo', 'Estoque Máximo'], 'doughnut');
            return;
        }

        if (tipo === 'estoqueProdutos') {
            titulo.innerText = 'Estoque de produtos';
            subtitulo.innerText = 'Estoque atual, inventário e custo total';
            atualizarGraficoRelatorio([250, 170, 5400], ['Estoque Atual', 'Inventário', 'Custo Total (R$)'], 'bar');
            return;
        }

        // Default para evolução de vendas e vendas por produto
        if (tipo === 'vendasProduto') {
            titulo.innerText = 'Vendas por produto';
            subtitulo.innerText = 'Quantidade vendida por produto';
            atualizarGraficoRelatorio([40, 30, 20, 10], ['Produto A', 'Produto B', 'Produto C', 'Produto D'], 'bar');
            return;
        }

        if (tipo === 'evolucao') {
            // Para evolução, o intervalo deve ser definido por mostrarGraficoRelatorio
            titulo.innerText = 'Evolução de vendas';
            subtitulo.innerText = 'Por período';
            mostrarGraficoRelatorio('evolucao', 'dia');
            return;
        }

        // Fallback
        titulo.innerText = 'Relatório';
        subtitulo.innerText = '';
    }

    function mostrarGraficoRelatorio(tipo, intervalo) {
        const titulo = document.getElementById('relatorioTitulo');
        const subtitulo = document.getElementById('relatorioSubtitulo');
        if (tipo !== 'evolucao') {
            mostrarRelatorio(tipo);
            return;
        }

        titulo.innerText = 'Evolução de vendas';
        subtitulo.innerText = `Período: ${intervalo}`;

        let labels = [];
        let dados = [];
        if (intervalo === 'dia') {
            labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            dados = [120, 150, 90, 170, 200, 180, 220];
        } else if (intervalo === 'semana') {
            labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            dados = [520, 610, 580, 640];
        } else if (intervalo === 'mes') {
            labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
            dados = [1200, 1450, 1320, 1580, 1700, 1650];
        } else if (intervalo === 'ano') {
            labels = ['2022', '2023', '2024', '2025', '2026'];
            dados = [18000, 21000, 23000, 25000, 27000];
        }

        atualizarGraficoRelatorio(dados, labels, 'line');
    }

    function atualizarGraficoRelatorio(dados, labels, tipo = 'bar') {
        const ctx = document.getElementById('relatorioChart').getContext('2d');
        if (relatorioChart) {
            relatorioChart.destroy();
        }
        relatorioChart = new Chart(ctx, {
            type: tipo,
            data: {
                labels,
                datasets: [{
                    label: 'Valores',
                    data: dados,
                    backgroundColor: ['#f57c00', '#263238', '#90a4ae', '#ffb74d', '#4db6ac'],
                    borderColor: '#263238',
                    borderWidth: 1,
                    fill: tipo === 'line'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        atualizarLegenda(labels);
    }

    function atualizarLegenda(labels) {
        const legend = document.getElementById('relatorioLegend');
        legend.innerHTML = '';
        labels.slice(0, 4).forEach(lbl => {
            legend.innerHTML += `<label><input type="checkbox" checked disabled style="transform:scale(0.8)">${lbl}</label>`;
        });
    }

    function gerarConteudoRelatorio() {
        const titulo = document.getElementById('relatorioTitulo').innerText;
        const subtitulo = document.getElementById('relatorioSubtitulo').innerText;
        const data = document.getElementById('relatorioData').value;
        const tabela = document.getElementById('relatorioTable');
        const dataExibicao = data ? data.split('-').reverse().join('/') : '';
        const periodo = titulo === 'Extrato de vendas'
            ? `Data: ${dataExibicao}`
            : (subtitulo.includes('Data:') ? subtitulo : `${subtitulo}<br>Data: ${data}`);
        let corpo = `
            ${gerarCabecalhoEmpresa()}
            <div class="documento-titulo">${escaparHtml(titulo)}</div>
            <div class="documento-linha">${escaparHtml(periodo).replace('&lt;br&gt;', '<br>')}</div>
        `;

        if (tabela.style.display !== 'none') {
            corpo += `<table>${tabela.querySelector('table').innerHTML}</table>`;
        } else {
            const canvas = document.getElementById('relatorioChart');
            corpo += canvas ? `<img src="${canvas.toDataURL('image/png')}" style="width:100%; margin-top:12px;">` : '';
        }

        return { titulo, corpo };
    }

    function imprimirRelatorio() {
        const { titulo, corpo } = gerarConteudoRelatorio();
        imprimirDocumento(titulo, corpo);
    }

    function mostrarCupom() {
        document.getElementById('modeloCupom').style.display = 'block';
        document.getElementById('empresaCupom').innerHTML = gerarCabecalhoEmpresa();
        document.getElementById('cupomData').innerText = document.getElementById('dataFechamento').value;
        document.getElementById('cupomDinheiro').innerText = document.getElementById('fechDinheiro').innerText;
        document.getElementById('cupomDebito').innerText = document.getElementById('fechDebito').innerText;
        document.getElementById('cupomCredito').innerText = document.getElementById('fechCredito').innerText;
        document.getElementById('cupomPix').innerText = document.getElementById('fechPix').innerText;
        document.getElementById('cupomCrediario').innerText = document.getElementById('fechCrediario').innerText;
        document.getElementById('cupomTotal').innerText = `R$ ${Object.values(dadosTotais).reduce((total, valor) => total + Number(valor || 0), 0).toFixed(2)}`;
    }

    function imprimirCupom() {
        const data = document.getElementById('dataFechamento').value;
        const linhas = [
            ['Data do fechamento', data],
            ['Dinheiro', document.getElementById('fechDinheiro').innerText],
            ['Cartão Débito', document.getElementById('fechDebito').innerText],
            ['Cartão Crédito', document.getElementById('fechCredito').innerText],
            ['Pix', document.getElementById('fechPix').innerText],
            ['Crediário', document.getElementById('fechCrediario').innerText]
        ];
        const total = Object.values(dadosTotais).reduce((soma, valor) => soma + Number(valor || 0), 0);
        const corpo = `
            ${gerarCabecalhoEmpresa()}
            <div class="documento-titulo">FECHAMENTO DE CAIXA</div>
            ${linhas.map(([label, valor]) => `<div class="documento-linha"><strong>${label}:</strong><span style="float:right">${valor}</span></div>`).join('')}
            <div class="documento-total"><span>TOTAL DO CAIXA</span><span style="float:right">R$ ${total.toFixed(2)}</span></div>
            <div class="texto-centro" style="margin-top:16px;">Caixa encerrado com sucesso.</div>
        `;
        imprimirDocumento('Fechamento de Caixa', corpo);
    }

    // --- LÓGICA RECEBIMENTO ---
    let clienteSelecionado = null;
    let recebimentoPendente = null;

    function processarRecebimentoPendente(formaPagamento, valorPago, troco) {
        if (!recebimentoPendente) return false;

        const pedido = pedidos.find(item => item.id == recebimentoPendente.pedidoId);
        if (!pedido) {
            alert('O pedido do recebimento não foi encontrado.');
            recebimentoPendente = null;
            return true;
        }

        const valor = recebimentoPendente.valor;
        pedido.entrada = Math.min(Number(pedido.total) || 0, (Number(pedido.entrada) || 0) + valor);
        pedidos = pedidos.map(item => item.id == pedido.id ? pedido : item);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));

        if (!dadosTotais[formaPagamento]) dadosTotais[formaPagamento] = 0;
        dadosTotais[formaPagamento] += valor;
        detalhesTotais.push({
            data: new Date().toLocaleString('pt-BR'),
            forma: formaPagamento,
            valor,
            desc: `Recebimento do pedido ${pedido.id}`
        });
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        localStorage.setItem('detalhesTotais', JSON.stringify(detalhesTotais));

        ultimaVenda = {
            data: new Date().toLocaleString('pt-BR'),
            itens: [{ cod: `REC-${pedido.id}`, desc: `Recebimento pedido ${pedido.id}`, qtd: 1, unidade: 'un', valor }],
            total: valor,
            formaPagamento,
            valorPago,
            troco
        };
        salvarVendaNosHistorico(ultimaVenda);

        recebimentoPendente = null;
        totalVenda = 0;
        totalPagamento = 0;
        carrinho = [];
        atualizarCaixa();
        initTotais();
        fecharModalDinheiroCaixa();
        fecharModalPixCaixa();
        fecharModalPagamentoCaixa();
        listarRecebimentos(clienteSelecionado ? clienteSelecionado.id : pedido.cliente_id);
        document.querySelector('#tabelaParcelas tbody').innerHTML = '';
        alert(`Recebimento de R$ ${valor.toFixed(2)} finalizado no Caixa em ${formaPagamento}.`);
        return true;
    }

    function pesquisarClienteRecebimento() {
        const pesquisa = document.getElementById('pesquisaCliente').value.toLowerCase();
        const cliente = clientes.find(c => c.nome.toLowerCase().includes(pesquisa) || c.id.toString() === pesquisa);
        if (cliente) {
            clienteSelecionado = cliente;
            document.getElementById('recCodigo').value = cliente.id;
            document.getElementById('recNome').value = cliente.nome;
            document.getElementById('recTipo').value = cliente.tipo;
            document.getElementById('recCpf').value = cliente.cpf;
            document.getElementById('recCelular').value = cliente.celular;
            document.getElementById('recEmail').value = cliente.email;
            document.getElementById('recCep').value = cliente.cep;
            document.getElementById('recEndereco').value = cliente.endereco;
            document.getElementById('recNumero').value = cliente.numero;
            document.getElementById('recBairro').value = cliente.bairro;
            document.getElementById('recComplemento').value = cliente.complemento;
            document.getElementById('recCidade').value = cliente.cidade;
            document.getElementById('recUf').value = cliente.uf;
            document.getElementById('recObservacoes').value = cliente.observacoes || '';
            document.getElementById('labelRecCpf').innerText = cliente.tipo === 'PF' ? 'CPF:' : 'CNPJ:';
            document.getElementById('dadosCliente').style.display = 'block';
            listarRecebimentos(cliente.id);
        } else {
            alert('Cliente não encontrado!');
            document.getElementById('dadosCliente').style.display = 'none';
            clienteSelecionado = null;
        }
    }

    function listarRecebimentos(clienteId) {
        const tbody = document.querySelector('#tabelaRecebimentos tbody');
        tbody.innerHTML = '';
        const recebimentos = pedidos.filter(p => p.cliente_id == clienteId && parseFloat(p.entrada) < parseFloat(p.total));
        recebimentos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id}</td>
                <td>${p.data}</td>
                <td>R$ ${parseFloat(p.total).toFixed(2)}</td>
                <td>R$ ${parseFloat(p.entrada).toFixed(2)}</td>
                <td>R$ ${(parseFloat(p.total) - parseFloat(p.entrada)).toFixed(2)}</td>
                <td><button onclick="selecionarPedido(${p.id})">Ver Parcelas</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function selecionarPedido(pedidoId) {
        const pedido = pedidos.find(p => p.id == pedidoId);
        const tbody = document.querySelector('#tabelaParcelas tbody');
        tbody.innerHTML = '';
        // Simular parcelas: dividir o restante em 3 parcelas
        const restante = parseFloat(pedido.total) - parseFloat(pedido.entrada);
        const valorParcela = restante / 3;
        for (let i = 1; i <= 3; i++) {
            const vencimento = new Date();
            vencimento.setMonth(vencimento.getMonth() + i);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i}</td>
                <td>${vencimento.toLocaleDateString('pt-BR')}</td>
                <td>R$ ${valorParcela.toFixed(2)}</td>
                <td>Pendente</td>
                <td><input type="checkbox" class="parcela-check" data-parcela="${i}" data-valor="${valorParcela}" data-pedido="${pedidoId}"></td>
            `;
            tbody.appendChild(tr);
        }
    }

    function finalizarNoCaixa() {
        const selecionadas = document.querySelectorAll('.parcela-check:checked');
        if (selecionadas.length === 0) {
            alert('Selecione pelo menos uma parcela!');
            return;
        }
        if (!caixaAberto) {
            alert('Abra o caixa antes de finalizar o recebimento.');
            return;
        }

        let total = 0;
        const pedidoId = selecionadas[0].dataset.pedido;
        selecionadas.forEach(cb => {
            total += parseFloat(cb.dataset.valor);
        });
        recebimentoPendente = { pedidoId, valor: total };
        carrinho = [{ cod: `REC-${pedidoId}`, desc: `Recebimento do pedido ${pedidoId}`, unidade: 'un', valor: total, qtd: 1 }];
        totalVenda = total;
        totalPagamento = 0;
        atualizarCaixa();
        mudarTela('screen-caixa', document.querySelector('li[onclick*="screen-caixa"]'));
        abrirModalPagamentoCaixa();
    }

    function fecharCaixa() {
        if (!caixaAberto) {
            alert('O caixa já está fechado.');
            return;
        }
        if (!confirm('Deseja fechar o caixa e zerar os totais atuais?')) return;
        mostrarCupom();
        dadosTotais = {
            Dinheiro: 0.00,
            'Cartão Débito': 0.00,
            'Cartão Crédito': 0.00,
            Pix: 0.00,
            Crediario: 0.00
        };
        detalhesTotais = [];
        caixaAberto = false;
        saldoInicialCaixa = 0;
        localStorage.setItem('dadosTotais', JSON.stringify(dadosTotais));
        localStorage.setItem('detalhesTotais', JSON.stringify(detalhesTotais));
        localStorage.setItem('caixaAberto', 'false');
        localStorage.setItem('saldoInicialCaixa', '0');
        initTotais();
        initFecharCaixa();
        atualizarStatusCaixa();
        carrinho = [];
        totalVenda = 0;
        atualizarCaixa();
        alert('Caixa fechado com sucesso. Os totais foram zerados e os cadastros foram preservados.');
    }

    // --- LÓGICA DEVOLUÇÃO ---
    let devolucoes = [];

    function atualizarTotalDevolucao() {
        let total = devolucoes.reduce((soma, d) => soma + d.total, 0);
        document.getElementById('valorDevolucao').innerText = `R$ ${total.toFixed(2)}`;
        document.getElementById('totalDevolucao').innerText = `R$ ${total.toFixed(2)}`;
    }

    function inserirDevolucao() {
        const produto = document.getElementById('devolucaoProduto').value;
        const un = document.getElementById('devolucaoUnidade').value;
        const qtd = parseFloat(document.getElementById('devolucaoQtd').value) || 0;
        const unit = parseFloat(document.getElementById('devolucaoUnit').value) || 0;
        const total = qtd * unit;
        if (!produto || qtd <= 0 || unit <= 0) {
            alert('Preencha todos os campos corretamente!');
            return;
        }
        devolucoes.push({ produto, un, qtd, unit, total });
        renderTabelaDevolucao();
        atualizarTotalDevolucao();
        document.getElementById('devolucaoProduto').value = '';
        document.getElementById('devolucaoUnidade').value = '';
        document.getElementById('devolucaoQtd').value = 1;
        document.getElementById('devolucaoUnit').value = 0.00;
        document.getElementById('devolucaoTotal').value = '';
    }

    function renderTabelaDevolucao() {
        const area = document.getElementById('tabelaDevolucao');
        area.innerHTML = '';
        devolucoes.forEach((d, i) => {
            area.innerHTML += `<div style="display:flex; border-bottom:1px solid #eee; align-items:center; padding:6px 0; font-size:0.98rem;">
            <div style='flex:2'>${d.produto}</div>
            <div style='flex:0.7; text-align:center;'>${d.un}</div>
            <div style='flex:0.7; text-align:center;'>${d.qtd}</div>
            <div style='flex:1; text-align:center;'>R$ ${d.unit.toFixed(2)}</div>
            <div style='flex:1; text-align:center;'>R$ ${d.total.toFixed(2)}</div>
        </div>`;
        });
    }

    document.getElementById('devolucaoQtd').addEventListener('input', atualizarCampoTotalDevolucao);
    document.getElementById('devolucaoUnit').addEventListener('input', atualizarCampoTotalDevolucao);

    function atualizarCampoTotalDevolucao() {
        const qtd = parseFloat(document.getElementById('devolucaoQtd').value) || 0;
        const unit = parseFloat(document.getElementById('devolucaoUnit').value) || 0;
        document.getElementById('devolucaoTotal').value = (qtd * unit).toFixed(2);
    }

    // Inicialização dos valores de venda/pagamento (exemplo)
    document.getElementById('valorVenda').innerText = 'R$ 00,00';
    document.getElementById('valorPagamento').innerText = 'R$ 00,00';

    // mudei para atalhos C, N, Y, D
// Variável global para saber qual pagamento foi escolhido
// 1. DEFINIÇÃO DA FUNÇÃO DE SELEÇÃO (Para evitar o erro "not defined")
// 1. FUNÇÃO DE SELEÇÃO VISUAL (Resolve o erro do mouse e das teclas C, Y, N)
// 1. Variável global para armazenar a escolha
// 1. Variável global para controle
let formaPagamentoEscolhida = "";

// 2. FUNÇÃO DE SELEÇÃO VISUAL (Ativada por C, Y, N ou Clique)
function selecionarOpcao(elemento, nome) {
    console.log("Forma selecionada: " + nome);
    
    // Limpa destaque dos outros botões
    const container = elemento.parentElement;
    const botoes = container.querySelectorAll('button');
    botoes.forEach(btn => {
        btn.style.border = "none";
        btn.style.backgroundColor = ""; 
        btn.style.opacity = "0.7";
    });
    
    // Aplica destaque no selecionado
    elemento.style.border = "3px solid white";
    elemento.style.backgroundColor = "#2e5fb7"; 
    elemento.style.opacity = "1";
    
    // Salva a escolha para o sistema saber o que foi usado
    formaPagamentoEscolhida = nome;
    window.formaPagamentoAtual = nome; 
}

// 3. FUNÇÃO DO BOTÃO "FINALIZAR VENDA (F9)"
// Esta função decide o que fazer quando o F9 é apertado no modal principal
function confirmarPagamento() {
    console.log("Tentando confirmar: " + window.formaPagamentoAtual);

    if (window.formaPagamentoAtual === 'Cartão Débito' || 
        window.formaPagamentoAtual === 'Cartão Crédito' || 
        window.formaPagamentoAtual === 'Crediário') {
        
        console.log("Finalizando via motor do sistema...");
        
        // CHAMA A GRAVAÇÃO
        confirmarPagamentoPix(); 

        // NOVIDADE: Fecha o modal de pagamentos após a gravação 
        // para garantir que a tela limpe mesmo com o erro anterior
        setTimeout(() => {
            fecharModalPagamentoCaixa();
        }, 500); 
    } 
    else {
        alert("Por favor, selecione uma forma de pagamento antes de finalizar.");
    }
}

// 4. ESCUTADOR DE TECLAS (ATALHOS)
document.addEventListener('keydown', function(event) {
    const tecla = event.key.toUpperCase();
    
    // Atalhos de pagamento (D, P, C, Y, N) funcionam mesmo com foco em input/textarea
    const mapeamento = {
        'D': 'btn-dinheiro',
        'P': 'btn-pix',
        'C': 'btn-debito',
        'Y': 'btn-credito',
        'N': 'btn-crediario'
    };

    if (mapeamento[tecla]) {
        const btn = document.getElementById(mapeamento[tecla]);
        if (btn) {
            // Apenas da click se a modal de pagamento está aberta
            const modalPagamento = document.getElementById('modalPagamentoCaixa');
            if (modalPagamento && modalPagamento.style.display === 'flex') {
                btn.click();
                event.preventDefault();
                return;
            }
        }
    }

    const tag = event.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    // --- F9: O DISPARADOR ---
    if (event.key === 'F9') {
        event.preventDefault();
        
        const modalDinheiro = document.getElementById('modalDinheiroCaixa');
        const modalPix = document.getElementById('modalPixCaixa');

        // Se estiver nos modais específicos, chama as funções deles
        if (modalDinheiro && modalDinheiro.style.display !== 'none') {
            confirmarPagamentoDinheiro();
        } else if (modalPix && modalPix.style.display !== 'none') {
            confirmarPagamentoPix();
        } else {
            // Se estiver no modal principal, chama a nossa nova função de ponte
            confirmarPagamento();
        }
    }

    // --- F10: IMPRIMIR COMPROVANTE ---
    if (event.key === 'F10') {
        event.preventDefault();
        imprimirVenda();
    }
});
// Procure o final do seu arquivo e cole lá:

document.addEventListener('DOMContentLoaded', function() {
    
    // Todo o código das setas que você copiou entra aqui...
    
    let indiceLinhaSelecionada = -1;

    const inputBusca = document.getElementById('modalBuscaProduto');
    if (inputBusca) {
        inputBusca.addEventListener('keydown', function(e) {
            const corpoTabela = document.getElementById('modalProdutosBody');
            const linhas = corpoTabela.getElementsByTagName('tr');
            
            if (linhas.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (indiceLinhaSelecionada < linhas.length - 1) {
                    indiceLinhaSelecionada++;
                    atualizarDestaqueLinha(linhas);
                }
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (indiceLinhaSelecionada > 0) {
                    indiceLinhaSelecionada--;
                    atualizarDestaqueLinha(linhas);
                }
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (indiceLinhaSelecionada > -1) {
                    linhas[indiceLinhaSelecionada].click();
                }
            }
        });

        inputBusca.addEventListener('input', function() {
            indiceLinhaSelecionada = -1;
        });
    }
});

// 1. Variável global (fora de qualquer função)
let indiceLinhaSelecionada = -1;

// 2. Função para destacar (ajustada para ser mais forte)
function atualizarDestaqueLinha(linhas) {
    for (let i = 0; i < linhas.length; i++) {
        linhas[i].classList.remove('linha-selecionada');
        linhas[i].style.backgroundColor = ""; // Limpa manual
    }
    
    if (indiceLinhaSelecionada >= 0 && linhas[indiceLinhaSelecionada]) {
        const linhaAtiva = linhas[indiceLinhaSelecionada];
        linhaAtiva.classList.add('linha-selecionada');
        linhaAtiva.style.backgroundColor = "#2e5fb7"; // Força o azul
        linhaAtiva.style.color = "white";
        linhaAtiva.scrollIntoView({ block: 'nearest' });
        console.log("Linha selecionada:", indiceLinhaSelecionada);
    }
}

// 3. Escutador de Teclas (Coloque isso no FINAL do arquivo)
document.addEventListener('keydown', function(e) {
    // Só executa se o modal de produtos estiver aberto
    const modal = document.getElementById('modalProdutosCaixa');
    if (!modal || modal.style.display === 'none') return;

    const corpoTabela = document.getElementById('modalProdutosBody');
    const linhas = corpoTabela.getElementsByTagName('tr');
    
    if (linhas.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (indiceLinhaSelecionada < linhas.length - 1) {
            indiceLinhaSelecionada++;
            atualizarDestaqueLinha(linhas);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (indiceLinhaSelecionada > 0) {
            indiceLinhaSelecionada--;
            atualizarDestaqueLinha(linhas);
        }
    } else if (e.key === 'Enter') {
        if (indiceLinhaSelecionada > -1) {
            e.preventDefault();
            console.log("Enter pressionado na linha:", indiceLinhaSelecionada);
            linhas[indiceLinhaSelecionada].click(); // Isso dispara a seleção do produto
        }
    }
});
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('modalProdutosCaixa');
    
    // Só funciona se o modal de produtos estiver VISÍVEL
    if (!modal || modal.style.display === 'none') return;

    const corpoTabela = document.getElementById('modalProdutosBody');
    const linhas = corpoTabela.getElementsByTagName('tr');
    
    if (linhas.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        indiceLinhaSelecionada = Math.min(indiceLinhaSelecionada + 1, linhas.length - 1);
        atualizarDestaqueLinha(linhas);
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        indiceLinhaSelecionada = Math.max(indiceLinhaSelecionada - 1, 0);
        atualizarDestaqueLinha(linhas);
    } 
    else if (e.key === 'Enter') {
        if (indiceLinhaSelecionada > -1) {
            e.preventDefault();
            // Clica na linha selecionada (que dispara o tr.onclick acima)
            linhas[indiceLinhaSelecionada].click();
        }
    }
});

function atualizarDestaqueLinha(linhas) {
    // Limpa todas as linhas
    for (let i = 0; i < linhas.length; i++) {
        linhas[i].style.backgroundColor = ""; 
        linhas[i].style.color = "";
        linhas[i].classList.remove('linha-selecionada');
    }
    
    // Destaca a nova
    const linhaAtiva = linhas[indiceLinhaSelecionada];
    if (linhaAtiva) {
        linhaAtiva.style.backgroundColor = "#2e5fb7"; // Azul profissional
        linhaAtiva.style.color = "white";
        linhaAtiva.classList.add('linha-selecionada');
        linhaAtiva.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}
document.getElementById('caixaInputQtd').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        if (!produtoSelecionadoModal) {
            alert("Nenhum produto selecionado. Use F3 para buscar.");
            return;
        }

        const qtd = parseFloat(this.value) || 1;
        
        // Adiciona ao carrinho usando a sua função existente
        adicionarAoCarrinho(produtoSelecionadoModal, qtd);
        
        // Limpa a seleção para a próxima venda
        produtoSelecionadoModal = null;
        this.value = '1';
        
        // Volta o foco para o campo de busca principal (Código de Barras/F3)
        const campoBuscaPrincipal = document.getElementById('modalBuscaProduto') || document.getElementById('inputCodigoBarras');
        if (campoBuscaPrincipal) {
            campoBuscaPrincipal.focus();
        }
    }
});