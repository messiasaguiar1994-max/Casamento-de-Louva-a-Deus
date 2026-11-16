# 💍 Casamento dos Louva-a-Deus — jogo 3D para TikTok LIVE

Uma festa de casamento de louva-a-deus que nunca para. Quem entra na sua live vira um louva-a-deus convidado, com nome e foto de perfil em cima da cabeça. Comentários, curtidas e presentes fazem os convidados dançar, ganhar corações, virar padrinho ou madrinha e até sair voando de foguete.

---

## 1. No celular (aplicativo .APK) — sem PC

Funciona igual à Pescaria: o **aplicativo** roda o jogo no celular e um **servidor grátis no Render** lê a sua live.

**Baixar e instalar o app**
1. Abra **https://github.com/messiasaguiar1994-max/Casamento-de-Louva-a-Deus/releases/latest** no celular.
2. Toque em **casamento-louva-a-deus.apk** para baixar e depois abra o arquivo.
3. Se o Android pedir, permita "instalar apps desta fonte".
   O app se chama **Casamento Louva-a-Deus** e não substitui os outros (Pescaria, Elefante...).

**Ligar o servidor no Render (só uma vez)**
1. Entre em **https://dashboard.render.com** → **New +** → **Blueprint**.
2. Escolha o repositório **Casamento-de-Louva-a-Deus** e clique em **Apply**.
3. Ele cria o serviço **tiktok-casamento**. Quando ficar verde ("Live"), copie o endereço dele (algo como `https://tiktok-casamento.onrender.com`).
4. (Opcional) Se você tem a chave do eulerstream.com usada na Pescaria, coloque em **Environment → EULER_API_KEY**.

**Na hora da live**
1. Abra o app e toque na tela para começar a festa.
2. Toque no **⚙** (canto de baixo, à direita) para abrir o painel.
3. Confira o **Servidor** (o endereço do Render), digite seu **@** e toque em **Conectar**.
   O servidor grátis "dorme" quando ninguém usa: na primeira vez pode levar até 1 minuto para acordar.
4. Quando aparecer **"Ao vivo! Conectado..."**, toque em **✕ Fechar**.
5. Comece a live no TikTok pelo **modo jogo** (transmitir a tela) e volte para o app.

O app deixa a tela sempre acesa e em tela cheia. Se ficar travando, ele baixa a qualidade sozinho (ou mude em **Painel → Qualidade**).

## 2. No PC (Windows) — opcional

1. Instale o **Node.js** (versão LTS) em **https://nodejs.org**.
2. Baixe o projeto (botão verde **Code → Download ZIP** no GitHub) e descompacte.
3. Dois cliques em **INICIAR.bat**. Ele abre o jogo em **http://localhost:8787**. Não feche a janela preta.
4. Painel na tecla **P** → digite seu @ → **Conectar**.

## 3. Colocar o jogo na transmissão pelo PC (TikTok LIVE Studio)

1. Deixe o jogo aberto no navegador (tecla **F** = tela cheia).
2. No LIVE Studio, adicione **Captura de janela** e escolha o navegador.
3. **Não minimize** a janela do navegador.

## 4. O que acontece na festa

| Na live | No jogo |
|---|---|
| Entrou na live | O convidado aparece sob o arco de flores e caminha até o seu lugar |
| Comentou | Entra na festa (se ainda não estava) e acena |
| Curtiu | Pulinho com coraçãozinho |
| Seguiu / compartilhou | Comemoração com confete |
| 🌹 Rosa | Dança especial com brilhos e notas musicais |
| 💗 Coração | Corações em volta do personagem |
| 🚀 Foguete | Lançado para o alto, fogos, volta de paraquedas e fica tonto |
| 💋 Perfume | Os noivos se beijam |
| Presente de 10+ 💎 | Chuva de confete na festa toda |
| Presente de 99+ 💎 | Vira **padrinho** (terno e cartola) ou **madrinha** (vestido e coroa de flores) |
| Presente de 500+ 💎 | **Convidado de honra**: fica dourado, ganha coroa e capa, vai para a frente dos noivos com holofote |

Tudo isso pode ser mudado no **Painel → Ações dos presentes**, sem mexer no código.

Sozinhos, os noivos alternam entre dança romântica, dança animada, beijo e comemoração. A câmera troca de ângulo e dá close em quem mandou presente. A cada 2 ou 3 minutos todos fazem uma dança em grupo.

**Sobre restrição do TikTok:** a tela não mostra nenhum texto pedindo presente nem prometendo prêmio. As regras, você explica falando na live.

## 5. Painel (tecla P)

- **Live do TikTok**: conectar com seu @.
- **Convidados**: adicionar alguém manualmente, adicionar 10 ou 50 de teste, encher até o limite, remover, limpar, reiniciar a festa e mudar o limite (começa em 100, vai até 200).
- **Parentes**: louva-a-deus de enfeite (Tia Mantídia, Vovô Louvadão...) para a festa não começar vazia. Eles saem primeiro quando a festa lota.
- **Testar eventos**: simular entrada, comentário, curtida e qualquer presente.
- **Ações dos presentes**: escolher o que cada presente faz (pelo nome do presente ou pelo valor em diamantes).
- **Noivos**: mudar os nomes e testar dança romântica, dança, beijo, comemoração e surpresa.
- **Todos os convidados**: dança em grupo, comemorar, surpresa, palmas, confete e testar qualquer animação.
- **Música**: tocar, parar, próxima, marcha nupcial, volume, ou carregar **suas músicas MP3** (tocam em sequência).
- **Câmera e imagem**: câmera automática ou fixa, qualidade (use **Baixa** se o PC estiver lento) e mostrador de FPS.

**Atalhos:** `P` painel · `M` música liga/desliga · `Espaço` beijo dos noivos · `G` dança em grupo · `F` tela cheia

## 6. Música e sons

Todas as músicas e efeitos são **gerados pelo próprio jogo**, sem arquivos de áudio de terceiros:
- *Festa dos Louvas* (dance) e *Forró do Louva*: composições originais.
- *Marcha dos Noivos*: arranjo próprio do Coro Nupcial de Wagner (de 1850, domínio público), com final original.

Se quiser usar suas músicas, carregue os MP3 no painel. Use só músicas que você tem direito de usar.

---

## Para quem for mexer no código

```
npm install                  # instala tudo
npm run dev                  # modo de desenvolvimento (http://localhost:5173)
npm run build                # gera dist/index.html (arquivo único)
cd servidor && node server.js   # servidor da live + jogo (http://localhost:8787)
```

O APK é montado sozinho pelo GitHub (Actions → "Montar APK") a cada mudança, e fica em Releases.
Pastas do app: `android/` (projeto Capacitor), `capacitor.config.json`, `.github/workflows/apk.yml`, `render.yaml`.

Organização:

```
servidor/server.js          lê a live (tiktok-live-connector), serve o jogo, /status e /foto
src/main.js                 junta tudo e roda o laço principal
src/scene/hall.js           salão: pista de LED, altar, arco, mesas, lustres, balões, luzes
src/scene/director.js       câmera automática + rotina dos noivos
src/mantis/geometry.js      formas do louva-a-deus (cabeça, olhos, tórax, abdômen, patas)
src/mantis/rig.js           esqueleto articulado + IK das pernas (pés firmes no chão)
src/mantis/anims.js         todas as animações (para criar uma dança nova, adicione aqui)
src/mantis/heroes.js        noivo (fraque, cartola) e noiva (vestido, véu, buquê)
src/mantis/accessories.js   chapéus, óculos, colares, terno, vestido, coroa, capa, paraquedas
src/crowd/crowd.js          convidados (instancing), lugares em círculos, presentes, foguete
src/fx/particles.js         corações, brilhos, confete, fogos, fumaça
src/audio/audio.js          músicas e efeitos sonoros gerados no navegador
src/ui/hud.js, panel.js     interface da tela e painel
src/config.js               regras dos presentes (padrão)
```

Desempenho: as peças de todos os convidados são desenhadas com `InstancedMesh` (umas 40 chamadas de desenho para 200 personagens). Quem está longe da câmera é animado a cada 2 quadros, as partículas têm limite fixo, só os noivos projetam sombra de verdade (os convidados usam sombra simples) e as etiquetas só são atualizadas quando mudam.
