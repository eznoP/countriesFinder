# Explorador de Países

Aplicação web para consulta de países, desenvolvida como 1ª Avaliação da
disciplina de Programação Web (UESPI). Os dados são obtidos em tempo de
execução a partir da API pública CountriesNow, sem backend, banco de dados
ou dados estáticos.

## Integrantes

- Enzo Rios Veras Ost Lopes
- Antônio Lucas de Oliveira Neto 

## Principais funcionalidades

- **Listagem inicial** de todos os países com nome, capital, moeda e bandeira.
- **Busca por nome** com correspondência parcial, ignorando maiúsculas e
  minúsculas, com retorno à listagem completa pelo botão *Limpar* ou ao
  esvaziar o campo.
- **Detalhamento do país** em janela modal, exibindo nome, capital, moeda,
  bandeira, código do país (ISO2/ISO3), população e localização geográfica
  (latitude e longitude).
- **Tratamento de estados**: carregamento, sucesso, resultado vazio e erro de
  comunicação com a API.
- **Dados ausentes** são exibidos como "Não informado"; a interface nunca
  apresenta `undefined` ou `null`.
- **População formatada** para leitura no padrão brasileiro, acompanhada do
  ano de referência.

## API utilizada

[CountriesNow](https://countriesnow.space/) — `https://countriesnow.space/api/v0.1`

| Endpoint | Uso |
| --- | --- |
| `GET /countries/capital` | nome, capital e códigos ISO |
| `GET /countries/currency` | moeda |
| `GET /countries/flag/images` | bandeira |
| `GET /countries/population/q?country=` | população por ano |
| `GET /countries/positions/q?country=` | latitude e longitude |

As três primeiras listas são requisitadas em paralelo e combinadas pelo código
`iso2`, pois os nomes dos países divergem entre os endpoints.

## Tecnologias

- HTML5 semântico
- CSS3 (Grid, Flexbox, variáveis e layout responsivo)
- JavaScript (ES6+) com `fetch` nativo
- Elemento nativo `<dialog>` para a janela de detalhes

Nenhuma biblioteca, framework ou etapa de build é utilizada.

## Instruções de execução

Clone o repositório:

```bash
git clone https://github.com/eznoP/countriesFinder.git
cd countriesFinder
```

Abra o arquivo `index.html` no navegador. Alternativamente, sirva o diretório
por HTTP:

```bash
python3 -m http.server 8000
```

E acesse `http://localhost:8000`.

É necessária conexão com a internet, pois todos os dados vêm da API
CountriesNow.
