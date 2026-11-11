# Integração Assistente TJES → Contingência

Atualizado em 11/11/2026.

## Origem
- Extensão: `SuanEden/assistente-tjes-assyst`
- Site: `SuanEden/tjes-contingencia-demo`

## Incorporado ao site
- Consulta à base documental: os **472 artigos** de `biblioteca-tjes.json` já cobrem os 472 guias da extensão, identificados por código SATE.
- Catálogo local de modelos: `assistente-padroes.json`, com padrões ativos de Reset de senha 1840, PJeOffice 1990 e modelos de Fornecer Token e criação de usuário E-Jud.
- Separação Chefia/Chefiado no reset de senha: solicitante e usuário afetado são entidades diferentes quando o pedido é para um chefiado.
- Percursos documentados dos serviços 1840 e 1990 para consulta **apenas**, sem simular cliques no Assyst.
- Gerador de modelos genéricos por Serviço/Categoria, portado de `quick-suggestion.js`, em `assistente-gerador.js`.
- Pré-visualização e aplicação local de Resumo/Descrição em `#f-problema` e `#f-descricao`, confirmando substituição de texto existente.
- Reutilização de campos já informados no formulário local quando o vínculo é inequívoco; dados de terceiros não são copiados para o solicitante.

## Recursos do site já existentes, preservados
- Formulários e registros locais, painel, contatos, base de conhecimento e edição de artigos, pesquisa, exportação/importação, anexos e relatórios.
- A biblioteca do site não foi substituída pela cópia da extensão para evitar duplicatas.

## Não transportáveis para GitHub Pages sem integração autorizada
- Ler dados do **Assyst autenticado** por content script.
- Clicar nos cartões do catálogo e navegar automaticamente no Assyst.
- Alterar campos Dojo/Dijit/CKEditor na página real do TJES.
- Identificar agente autenticado ou selecionar Grupo/Usuário Atribuído no Assyst.
- Analisar, salvar ou atualizar chamados no servidor oficial do Assyst.

Essas operações permanecem na extensão. Uma integração servidor-a-servidor exigiria API oficial, autenticação e autorização de TI; a página estática pública não deve coletar credenciais ou fingir essa integração.

## Proteções
- O preenchimento por modelo **não salva** o chamado: requer ação explícita do usuário.
- Modelos não contêm dados pessoais reais.
- Os registros locais do site não foram modificados pela migração.
- O site mantém a advertência de não armazenar dados reais sem controles institucionais adequados.
- Resumo e descrição existentes não são sobrescritos sem confirmação.

## Verificações feitas
- Sintaxe dos arquivos JS integrados aprovada.
- Leitura de quatro modelos locais e dois percursos confirmada.
- Geração de resumo/descrição para seis categorias amostrais aprovada.
- Presença e ordenação dos scripts em `index.html` conferidas.

## Testes pendentes
- Execução visual na URL pública do GitHub Pages.
- Aplicar cada modelo no navegador e validar campos/vínculos.
- Conferir versões mobile e modo escuro.
- Verificar se a publicação do GitHub Pages já terminou.

**Não considerar a integração como acesso funcional ao Assyst.**


## Polimento de estabilidade — 11/11/2026
- Busca por nome, serviço e resumo na lista de padrões integrados.
- Redefinição de senha gerada por Serviço/Categoria redirecionada ao modelo com escolha explícita Chefia/Chefiado.
- Prévia e dados do usuário afetado permanecem distintos dos dados da chefia.
- JS do gerador e da integração verificado sintaticamente; cinco amostras de geração de modelos passaram.
- O parâmetro de versão do script foi atualizado para reduzir o risco de usar uma cópia antiga em cache.

### Extensão correspondente — versão 0.26.3
- Observador de perfil do atendente limitado e desconectado após identificar o primeiro perfil válido.
- Menos verificações automáticas de classificação quando a aba está oculta ou ocupada.
- Mantido bloqueio de uma tentativa de atribuição por formulário; exclusões posteriores não são revertidas.

Não houve validação end-to-end no Assyst privado nem teste visual automatizado do GitHub Pages. A publicação do site depende do fluxo do GitHub Pages.
