# TJES Contingência — extensão Chrome/Edge (Manifest V3)

Esta versão contém o aplicativo completo dentro da extensão e não depende do GitHub Pages para abrir. Ela usa armazenamento local do próprio navegador e funciona sem internet após instalada. Os dados da extensão são separados dos dados do site.

## Instalação

1. Baixe o repositório em **Code → Download ZIP**: https://github.com/SuanEden/tjes-contingencia-demo
2. Extraia a pasta ZIP.
3. Abra `chrome://extensions` (Chrome) ou `edge://extensions` (Edge).
4. Ative **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação** (Chrome) / **Carregar descompactada** (Edge).
6. Selecione a pasta **extension** que contém `manifest.json`.
7. Fixe a extensão e clique no ícone para abrir o aplicativo em uma aba.

## Migrar dados do site para a extensão

1. Abra o site original e acesse **Importar e exportar**.
2. Selecione todas as categorias e clique em **Exportar selecionados**.
3. Abra a extensão e acesse **Importar e exportar**.
4. Importe o JSON e selecione as categorias desejadas; confirme após revisar.

## Limitações e segurança

- Sem sincronização automática entre máquinas, usuários ou site; o armazenamento é por navegador/perfil.
- Sem integração automática com Assyst.
- Dados armazenados em texto simples localmente: **não usar dados pessoais reais sem homologação de TI/segurança**.
- Faça exportações periódicas se houver autorização de uso; limpar dados da extensão pode apagar os registros.
- Não instale extensão não homologada em dispositivo corporativo sem autorização.
