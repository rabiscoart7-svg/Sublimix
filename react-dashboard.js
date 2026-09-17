(function () {
    const { createElement: h, useEffect, useState } = React;
    const { createRoot } = ReactDOM;
    const rootElement = document.getElementById('react-dashboard');
    if (!rootElement) return;

    const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function Dashboard() {
        const [summary, setSummary] = useState(null);
        const [products, setProducts] = useState([]);
        const [search, setSearch] = useState('');
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');

        async function loadData(query = '') {
            setLoading(true);
            setError('');
            try {
                const [summaryResponse, productsResponse] = await Promise.all([
                    fetch('/api/dashboard'),
                    fetch(`/api/products?search=${encodeURIComponent(query)}`)
                ]);
                if (!summaryResponse.ok || !productsResponse.ok) throw new Error('API indisponível');
                setSummary(await summaryResponse.json());
                setProducts(await productsResponse.json());
            } catch (requestError) {
                setError('Não foi possível sincronizar com a API. O modo local continua disponível.');
            } finally {
                setLoading(false);
            }
        }

        useEffect(() => { loadData(); }, []);
        useEffect(() => {
            const timer = setTimeout(() => loadData(search), 250);
            return () => clearTimeout(timer);
        }, [search]);

        return h('section', { className: 'react-dashboard-panel', 'aria-label': 'Resumo conectado à API' },
            h('div', { className: 'react-dashboard-heading' },
                h('div', null, h('span', { className: 'react-eyebrow' }, 'Dados online'), h('h2', null, 'Visão rápida')),
                h('button', { className: 'react-refresh', onClick: () => loadData(search), disabled: loading }, loading ? 'Atualizando...' : 'Atualizar')
            ),
            error && h('p', { className: 'react-api-error', role: 'alert' }, error),
            h('div', { className: 'react-metrics' },
                h('div', null, h('strong', null, summary ? summary.products : '--'), h('span', null, 'Produtos ativos')),
                h('div', null, h('strong', null, summary ? summary.stock.toLocaleString('pt-BR') : '--'), h('span', null, 'Itens em estoque')),
                h('div', null, h('strong', null, summary ? summary.lowStock : '--'), h('span', null, 'Estoque baixo')),
                h('div', null, h('strong', null, summary ? formatCurrency(summary.salesToday) : '--'), h('span', null, 'Vendas hoje'))
            ),
            h('label', { className: 'react-search-label' }, 'Consulta rápida de produtos',
                h('input', { value: search, onChange: (event) => setSearch(event.target.value), placeholder: 'Nome ou código' })
            ),
            h('div', { className: 'react-products-list' }, products.length ? products.slice(0, 5).map((product) =>
                h('button', { className: 'react-product-row', key: product.id, onClick: () => {
                    const input = document.getElementById('caixaInputProduto');
                    if (input) { input.value = product.codigo; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }
                } }, h('span', null, product.nome, h('small', null, product.codigo)), h('b', null, formatCurrency(product.preco_venda)))
            ) : h('p', { className: 'react-empty' }, loading ? 'Carregando produtos...' : 'Nenhum produto encontrado.'))
        );
    }

    createRoot(rootElement).render(h(Dashboard));
})();