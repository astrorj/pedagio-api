# Como configurar os valores reais de pedágio

Para o site parar de mostrar "Estimativa simulada" e exibir **valores reais**, é preciso configurar a API da Maplink.

## 1. Abrir o arquivo `.env`

Na pasta do projeto (`pedagiodigital`) existe o arquivo **`.env`**. Abra com o Bloco de Notas ou no Cursor.

## 2. Obter as chaves da Maplink

- Acesse **https://maplink.global/** e entre em contato (vendas ou suporte).
- Solicite acesso à **Toll API** (API de pedágios) e peça:
  - **Client ID**
  - **Client Secret**
- Eles enviam essas chaves por e-mail ou painel.

## 3. Colar as chaves no `.env`

No arquivo `.env`, preencha na mesma linha do sinal `=`:

```
MAPLINK_CLIENT_ID=cole_aqui_o_client_id
MAPLINK_CLIENT_SECRET=cole_aqui_o_client_secret
```

**Exemplo** (não use esses valores, são só ilustração):

```
MAPLINK_CLIENT_ID=abc123xyz
MAPLINK_CLIENT_SECRET=senha_secreta_456
```

Salve o arquivo (Ctrl+S).

## 4. Reiniciar o servidor

No terminal onde está rodando `npm start`:

1. Pare o servidor (Ctrl+C).
2. Suba de novo: `npm start`.
3. Abra no navegador: **http://localhost:3000**.

Faça uma nova consulta (origem, destino, tipo de veículo). Se as chaves estiverem corretas, os valores exibidos serão os reais da Maplink.

---

## (Opcional) Consulta pela placa

Se quiser que o tipo de veículo seja detectado **pela placa**, use a Infosimples:

1. Acesse **https://infosimples.com/consultas/antt-veiculo/** e contrate o serviço.
2. Eles informam um **token** e o **e-mail** da conta.
3. No `.env`, preencha:

```
INFOSIMPLES_TOKEN=seu_token
INFOSIMPLES_EMAIL=seu@email.com
```

4. Reinicie o servidor (`npm start`).

Com isso, ao informar a placa no formulário, a API usa a categoria do veículo retornada pela Infosimples.

---

**Resumo:** O arquivo `.env` já está criado. Falta só você colar o **Client ID** e o **Client Secret** da Maplink nele e reiniciar o `npm start`. As chaves só a Maplink pode te fornecer.
