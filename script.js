'use strict'; // Modo estrito, ajuda na detecção de erros
const API_BASE ='https://countriesnow.space/api/v0.1'; // API do countriesnow
let allCountries = []; // Lista que armazena os países

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearButton = document.getElementById('clear-button');
const statusEl = document.getElementById('status');
const countryList = document.getElementById('country-list');
const detailTitle = document.getElementById('detail-title');
const detailDialog = document.getElementById('detail-dialog');
const detailBody = document.getElementById('detail-body');
const closeDialog = document.getElementById('close-dialog');

// Intl.DisplayNames: tradutor de códigos de região nativo do navegador
const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

// Traduz o ISO2 para português. Código não reconhecido volta como ele mesmo,
// e nesse caso ficamos com o nome original em inglês
function localName(iso2, fallback) {
    if (!iso2) return fallback;
    try {
        const translated = regionNames.of(iso2);
        return translated === iso2 ? fallback : translated;
    } catch {
        return fallback;
    }
}

// Tira acentos para a busca: "sao" encontra "São Tomé e Príncipe"
function normalize(text) {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

async function fetchFromApi(path) { 
// async - permite usar await e faz a função devolver uma Promise(representa a eventual conclusão - ou falha- de uma operação assíncrona)
    const res = await fetch(API_BASE + path); 
    if (!res.ok) { // Checagem de status - se for diferente de "sucesso" mostrar menssagem de erro
        throw new Error(`Erro HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json.error) {
        throw new Error(json.msg);
    }
    return json.data;
}

function mergeCountries(capitals, currencies, flags){
    // byIso: transforma o array num Map indexado por iso2 (código do país → objeto do país),
    // para consultar com .get() em vez de varrer o array com .find()
    const byIso = (arr) => new Map(arr.map(item => [item.iso2, item]));
    // uso do Map, melhor que .find pois em vez de percorrer todo o conteúdo, ele vai direto por chave
    const currencyMap = byIso(currencies);
    const flagMap = byIso(flags);
    return capitals.map(c => ({
        name: localName(c.iso2, c.name), // nome exibido e buscado
        apiName: c.name, // /q?country= só aceita o nome em inglês
        iso2: c.iso2,
        iso3: c.iso3,
        capital: c.capital,
        currency: currencyMap.get(c.iso2)?.currency,
        flag: flagMap.get(c.iso2)?.flag
    })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); // traduzir desordena a lista
}

// Escreve a mensagem de status e marca o tipo, que o CSS usa para colorir
function setStatus(message, type) {
    statusEl.textContent = message;
    if (type) {
        statusEl.dataset.type = type;
    } else {
        delete statusEl.dataset.type;
    }
}

// RF04: nunca exibir null/undefined. ?? pega só null/undefined (|| pegaria 0 e '')
function display(value) {
    return value ?? 'Não informado';
}

// Monta o <li> de um país. Devolve o elemento pronto, sem tocar na página
function createCountryCard(country) {
    const li = document.createElement('li');
    li.className = 'country-card';

    // <button> e não <div>: já vem focável pelo Tab e acionável por Enter/Espaço
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'country-button';
    button.dataset.iso2 = country.iso2; // guarda qual país é, para o detalhe

    if (country.flag) {
        const img = document.createElement('img');
        img.className = 'country-flag';
        img.src = country.flag;
        img.alt = `Bandeira de ${country.name}`;
        img.loading = 'lazy'; // 222 imagens de uma vez travariam a página
        button.appendChild(img);
    } else {
        // RF04: os ~28 países sem bandeira na API mostram um substituto
        const placeholder = document.createElement('span');
        placeholder.className = 'flag-placeholder';
        placeholder.textContent = 'Bandeira Não Registrada';
        button.appendChild(placeholder);
    }

    const name = document.createElement('h2');
    name.className = 'country-name';
    name.textContent = country.name; // textContent, não innerHTML: dado da API é texto, não código
    button.appendChild(name);

    const capital = document.createElement('p');
    capital.className = 'country-meta';
    capital.textContent = `Capital: ${display(country.capital)}`;
    button.appendChild(capital);

    const currency = document.createElement('p');
    currency.className = 'country-meta';
    currency.textContent = `Moeda: ${display(country.currency)}`;
    button.appendChild(currency);

    li.appendChild(button);
    return li;
}

// Desenha a lista inteira na <ul>
function renderCountries(list, emptyMessage) {
    countryList.replaceChildren(); // limpa o render anterior, senão os cards empilham

    if (list.length === 0) {
        setStatus(emptyMessage ?? 'Nenhum país encontrado.', 'empty');
        return;
    }

    // DocumentFragment: monta fora da página e insere de uma vez (1 reflow em vez de 250)
    const fragment = document.createDocumentFragment();
    list.forEach(country => fragment.appendChild(createCountryCard(country)));
    countryList.appendChild(fragment);
}

async function loadCountries(){
    setStatus('Carregando países...', 'loading');

    try{
        const [capitals, currencies, flags] = await Promise.all([
            fetchFromApi('/countries/capital'),
            fetchFromApi('/countries/currency'),
            fetchFromApi('/countries/flag/images')
        ]);
        allCountries = mergeCountries(capitals, currencies, flags);
        setStatus('');
        renderCountries(allCountries);
    } catch (err) {
        setStatus('Não foi possível carregar os países. Tente novamente.', 'error');
        console.error(err);
    }
}

// RF02: /q?country= só aceita nome exato, então a busca parcial é filtro local
function searchCountries(term) {
    const q = normalize(term.trim());
    if (!q) return allCountries; // campo vazio volta à listagem completa
    // aceita os dois idiomas: "alemanha" e "germany" acham o mesmo país
    return allCountries.filter(c => normalize(c.name).includes(q) || normalize(c.apiName).includes(q));
}

function runSearch() {
    if (allCountries.length === 0) return; // ainda carregando: não apagar o status
    const term = searchInput.value;
    setStatus('');
    renderCountries(searchCountries(term), `Nenhum país encontrado para "${term.trim()}".`);
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); // sem isso o form recarrega a página e perde a lista
    runSearch();
});
// filtro local, sem rede: debounce só adicionaria atraso
searchInput.addEventListener('input', runSearch);
clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus(); // foco volta ao campo, quem usa teclado não se perde
    runSearch();
});


// Monta um par rótulo/valor do <dl>. dt = termo, dd = definição
function appendDetailRow(dl, label, value) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = display(value);
    dl.append(dt, dd);
}

// Pega o último registro de populationCounts (array crescente desde 1960)
function formatPopulation(result) {
    if (result.status !== 'fulfilled') return null; // a requisição falhou
    const counts = result.value.populationCounts;
    if (!counts || counts.length === 0) return null; // veio sem histórico
    const last = counts[counts.length - 1]; // length - 1 é o índice do último
    return `${last.value.toLocaleString('pt-BR')} habitantes (${last.year})`;
}

function formatPosition(result) {
    if (result.status !== 'fulfilled') return null; // a requisição falhou
    const position = result.value;
    if (position.lat === undefined || position.long === undefined) return null;
    return `Latitude ${position.lat}, Longitude ${position.long}`;
}

// RF03: nome, capital, moeda, bandeira, código e ISO já vêm de allCountries.
// Só população e localização exigem requisição
async function openDetail(country) {
    detailTitle.textContent = country.name;
    detailBody.replaceChildren();
    detailDialog.showModal();

    const loading = document.createElement('p');
    loading.textContent = 'Carregando detalhes...';
    detailBody.appendChild(loading);

    const query = `?country=${encodeURIComponent(country.apiName)}`;
    // allSettled e não all: se só a população falhar, a localização ainda aparece
    const [population, position] = await Promise.allSettled([
        fetchFromApi(`/countries/population/q${query}`),
        fetchFromApi(`/countries/positions/q${query}`)
    ]);

    detailBody.replaceChildren();

    if (country.flag) {
        const img = document.createElement('img');
        img.className = 'detail-flag';
        img.src = country.flag;
        img.alt = `Bandeira de ${country.name}`;
        detailBody.appendChild(img);
    }

    const dl = document.createElement('dl');
    dl.className = 'detail-list';
    appendDetailRow(dl, 'Capital', country.capital);
    appendDetailRow(dl, 'Moeda', country.currency);
    appendDetailRow(dl, 'Código ISO2', country.iso2);
    appendDetailRow(dl, 'Código ISO3', country.iso3);
    appendDetailRow(dl, 'População', formatPopulation(population));
    appendDetailRow(dl, 'Localização', formatPosition(position));
    detailBody.appendChild(dl);
}

// Um listener na <ul> em vez de 250 nos botões: o clique sobe até aqui
countryList.addEventListener('click', (event) => {
    const button = event.target.closest('.country-button');
    if (!button) return;
    const country = allCountries.find(c => c.iso2 === button.dataset.iso2);
    if (country) openDetail(country);
});

// showModal/close já devolvem o foco ao botão clicado sozinhos
closeDialog.addEventListener('click', () => detailDialog.close());

loadCountries();
