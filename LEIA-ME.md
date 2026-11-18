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

**Usando o app** (igual aos outros apps da live)
- Ao abrir aparece a tela inicial: **Usuário do TikTok**, **Conectar** e **▶ ENTRAR NA FESTA**.
- Para jogar sem live, toque direto em **ENTRAR NA FESTA**.
- Para a live: digite seu @, toque em **Conectar** (o servidor grátis pode levar até 1 minuto para acordar), espere a bolinha ficar verde e toque em **ENTRAR NA FESTA**. Depois comece a live no **modo jogo** do TikTok.
- Durante a festa, **toque na tela**: aparece **⚙ Menu** no canto de cima para voltar à tela inicial.
- Na tela inicial também tem: Configurações (servidor, qualidade, máximo de convidados, nomes dos noivos, painel completo), Música de fundo, Testar sem live e O que está chegando da live.

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

Só presentes contam (comentar e curtir não colocam ninguém na festa):

| Presente | No jogo |
|---|---|
| 🌹 Rosa | Entra na festa (chega pelo arco e dança). Se já está na festa, faz a dança especial |
| 🦖 Tiny Dino (10 moedas) | Vira **músico** da banda (sanfona, zabumba, triângulo ou violão). Banda de 4: quando lota, sai o mais antigo |
| 🍩 Rosquinha / 🦫 Capivara (30 moedas) | Vira o **noivo** ou a **noiva** (nome e foto em cima dos noivos). O anterior volta para a festa |

A cada 1 minuto aparecem discretamente as figurinhas da rosa, do Tiny Dino, da rosquinha e da capivara, sem nenhum texto.
A câmera alterna sozinha entre a festa, os noivos, a banda, a vista aérea e closes nos convidados.

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
