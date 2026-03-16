# Como obter valores reais (incluindo Free Flow) no site

No Brasil **não existe API pública e gratuita** que entregue valores oficiais de pedágio e Free Flow. As opções são as abaixo.

---

## Opção 1: Maplink (valores reais por rota, incluindo Free Flow)

A **Maplink** é a principal API comercial que fornece dados oficiais das concessionárias e da ANTT, **incluindo trechos Free Flow** na rota.

### O que você já tem no projeto

- A tela **“Consultar pedágio”** (origem + destino + veículo) já está integrada à Maplink.
- Quando você configura as chaves no `.env`, a API passa a retornar:
  - praças de pedágio convencionais;
  - **pórticos Free Flow** no trajeto (quando a rota tiver);
  - valores por categoria de veículo.

Ou seja: **não precisa de “uma API de Free Flow” separada** para ter valores reais na consulta por rota. Basta configurar a Maplink.

### Como configurar

1. Acesse **https://maplink.global/** e entre em contato (vendas/suporte).
2. Solicite acesso à **Toll API** (cálculo de pedágios em rotas).
3. Eles enviam **Client ID** e **Client Secret**.
4. No projeto, abra o arquivo **`.env`** e preencha:

```env
MAPLINK_CLIENT_ID=o_valor_que_eles_te_derem
MAPLINK_CLIENT_SECRET=o_valor_que_eles_te_derem
```

5. Salve, reinicie o servidor (`npm start`) e acesse **http://localhost:3000**.
6. Use a consulta com origem e destino; os valores exibidos (incluindo Free Flow quando houver na rota) passam a ser os reais da Maplink.

---

## Opção 2: Sua própria API Free Flow com tarifas oficiais

A **API Free Flow** que está no projeto (`/api/freeflow/...`) serve para **você** ser quem registra passagens e emite débitos (por exemplo, se você opera pórticos ou simula cobrança).

Ela **não busca valores na ANTT sozinha**; usa uma tabela de tarifas que você mantém no código. Para usar “valores reais” nessa API, você precisa **atualizar essa tabela** com valores que vêm de fontes oficiais.

### Onde ficam as tarifas

Arquivo: **`api/freeflow.js`**. No início há o objeto `GANTRIES`, por exemplo:

```js
const GANTRIES = {
  FF001: { nome: 'Free Flow - BR-116 Km 10', valor: { 1: 2.5, 2: 5.0, 3: 8.0, ... } },
  // ...
};
```

- **1** = moto  
- **2** = carro  
- **3** = caminhão 2 eixos  
- **4** = 3 eixos  
- **5** = 4+ eixos  

Você pode trocar os nomes dos pórticos e os números de `valor` pelos valores oficiais que encontrar.

### Onde achar valores oficiais

- **ANTT** – publica resoluções e tarifas das concessionárias:  
  **https://www.gov.br/antt/pt-br/assuntos/rodovias/pedagio**
- **Site da concessionária** da rodovia (ex.: CCR, EcoRodovias, etc.) – costumam divulgar tabelas de pedágio e Free Flow.
- Quando a ANTT ou a concessionária publicar nova tabela, você atualiza os números em `api/freeflow.js` e reinicia o servidor.

Assim, sua API Free Flow continua “sua” (registro de passagem, débitos por placa), mas com **valores alinhados ao que é oficial**.

---

## Resumo

| Objetivo | O que usar | O que configurar |
|----------|------------|------------------|
| **Valores reais na consulta por rota** (origem/destino), incluindo Free Flow quando existir no trajeto | Maplink (já integrada no site) | `.env` com `MAPLINK_CLIENT_ID` e `MAPLINK_CLIENT_SECRET` |
| **Valores “reais” na sua API Free Flow** (registro de passagem e débitos por placa) | API Free Flow do projeto | Atualizar tarifas em `api/freeflow.js` com dados das resoluções ANTT / concessionárias |

Para **finalizar o site com valores reais**, o caminho direto é: **contratar Maplink, colocar as chaves no `.env` e usar a consulta por rota**. A Maplink já entrega Free Flow quando a rota tiver pórticos; não é necessário outra API só para Free Flow nesse fluxo.
