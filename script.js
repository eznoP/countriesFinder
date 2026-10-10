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

async function loadCountries(){
    statusEl.textContent = 'Carregando países...';

    try{
        const [capitals, currencies, flags] = await Promise.all([
            fetchFromApi('/countries/capital'),
            fetchFromApi('/countries/currency'),
            fetchFromApi('/countries/flag/images')
        ]);
        allCountries = mergeCountries(capitals, currencies, flags);
        statusEl.textContent = '';
        console.log(allCountries);
    } catch (err) {
        statusEl.textContent = 'Não foi possível carregar os países. Tente novamente.';
        console.error(err);
    }
}
loadCountries();