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
        name: c.name,
        iso2: c.iso2,
        iso3: c.iso3,
        capital: c.capital,
        currency: currencyMap.get(c.iso2)?.currency,
        flag: flagMap.get(c.iso2)?.flag
    }));   
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
        placeholder.textContent = display(country.iso2);
        placeholder.setAttribute('aria-hidden', 'true');
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
function renderCountries(list) {
    countryList.replaceChildren(); // limpa o render anterior, senão os cards empilham

    if (list.length === 0) {
        setStatus('Nenhum país encontrado.', 'empty');
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
loadCountries();