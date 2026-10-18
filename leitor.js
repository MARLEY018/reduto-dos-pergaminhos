pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/* ==========================================
   Sons (arquivos opcionais: se não existirem, o site funciona igual)
   ========================================== */
const somPagina = new Audio('som/pagina.mp3');
somPagina.volume = 0.5;

const musicaFundo = new Audio('som/musica.mp3');
musicaFundo.loop = true;
musicaFundo.volume = 0.25;

const btnMusica = document.getElementById('btn-musica');
const btnTelaCheia = document.getElementById('btn-tela-cheia');
const contador = document.getElementById('contador-paginas');

let musicaLigada = localStorage.getItem('musicaLigada') === '1';

function atualizarIconeMusica() {
    btnMusica.textContent = musicaLigada ? '🔊' : '🔇';
}

function tocarMusica() {
    // O navegador pode bloquear o som até o primeiro clique; por isso o catch
    musicaFundo.play().catch(() => {
        musicaLigada = false;
        atualizarIconeMusica();
    });
}

btnMusica.onclick = () => {
    musicaLigada = !musicaLigada;
    localStorage.setItem('musicaLigada', musicaLigada ? '1' : '0');
    if (musicaLigada) tocarMusica(); else musicaFundo.pause();
    atualizarIconeMusica();
};

btnTelaCheia.onclick = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen().catch(() => {});
    }
};

atualizarIconeMusica();
if (musicaLigada) tocarMusica();

/* ==========================================
   Vagalumes flutuando no fundo
   ========================================== */
(function iniciarParticulas() {
    const canvas = document.getElementById('particulas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let largura, altura;

    function ajustar() {
        largura = canvas.width = window.innerWidth;
        altura = canvas.height = window.innerHeight;
    }
    ajustar();
    window.addEventListener('resize', ajustar);

    const total = 40;
    const vagalumes = Array.from({ length: total }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        raio: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        fase: Math.random() * Math.PI * 2
    }));

    function animar() {
        ctx.clearRect(0, 0, largura, altura);
        for (const v of vagalumes) {
            v.x += v.vx;
            v.y += v.vy;
            v.fase += 0.03;

            if (v.x < 0) v.x = largura;
            if (v.x > largura) v.x = 0;
            if (v.y < 0) v.y = altura;
            if (v.y > altura) v.y = 0;

            const brilho = (Math.sin(v.fase) + 1) / 2; // 0 a 1
            ctx.beginPath();
            ctx.arc(v.x, v.y, v.raio, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 200, 100, ' + (0.15 + brilho * 0.6) + ')';
            ctx.shadowColor = 'rgba(255, 180, 60, 0.9)';
            ctx.shadowBlur = 10;
            ctx.fill();
        }
        requestAnimationFrame(animar);
    }
    animar();
})();

/* ==========================================
   Busca o PDF salvo no IndexedDB pela página inicial
   ========================================== */
function pegarPdf() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('reduto', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('pdfs');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
            const get = req.result.transaction('pdfs').objectStore('pdfs').get('atual');
            get.onsuccess = () => resolve(get.result);
            get.onerror = () => reject(get.error);
        };
    });
}

/* ==========================================
   Converte o PDF em páginas e monta o livro
   ========================================== */
async function carregarEConverterPdf(origemPdf, chavePagina) {
    const avisoCarregando = document.getElementById('carregando-grimorio');
    const elementoLivro = document.getElementById('meu-livro');

    try {
        avisoCarregando.classList.remove('escondido');
        elementoLivro.innerHTML = '';

        const tempoInicio = Date.now();

        const loadingTask = pdfjsLib.getDocument(origemPdf);
        const pdfDoc = await loadingTask.promise;
        const totalPaginas = pdfDoc.numPages;

        const fragmentoPaginas = [];

        for (let numPagina = 1; numPagina <= totalPaginas; numPagina++) {
            const pagina = await pdfDoc.getPage(numPagina);
            const viewport = pagina.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const contexto = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await pagina.render({
                canvasContext: contexto,
                viewport: viewport
            }).promise;

            const paginaDiv = document.createElement('div');
            paginaDiv.className = 'pagina-livro';

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';

            paginaDiv.appendChild(img);
            fragmentoPaginas.push(paginaDiv);
        }

        fragmentoPaginas.forEach(pag => elementoLivro.appendChild(pag));

        const tempoDecorrido = Date.now() - tempoInicio;
        const tempoRestante = Math.max(0, 2000 - tempoDecorrido);

        setTimeout(() => {
            // Lembra a última página lida deste livro
            let paginaSalva = parseInt(localStorage.getItem(chavePagina), 10);
            if (isNaN(paginaSalva) || paginaSalva < 0 || paginaSalva >= totalPaginas) paginaSalva = 0;

            const pageFlip = new St.PageFlip(elementoLivro, {
                width: 350,
                height: 500,
                size: "fixed",
                showCover: true,
                maxShadowOpacity: 0.3,
                mobileScrollSupport: false,
                usePortrait: false,
                flippingTime: 900,
                startPage: paginaSalva
            });

            pageFlip.loadFromHTML(document.querySelectorAll('.pagina-livro'));

            function atualizarContador(indice) {
                contador.textContent = 'Página ' + (indice + 1) + ' de ' + totalPaginas;
                localStorage.setItem(chavePagina, indice);
            }
            atualizarContador(paginaSalva);

            // Som e contador ao virar a página
            pageFlip.on('flip', (e) => {
                atualizarContador(e.data);
                somPagina.currentTime = 0;
                somPagina.play().catch(() => {});
            });

            avisoCarregando.classList.add('escondido');

            // Setas da tela
            document.getElementById('btn-anterior').onclick = () => pageFlip.flipPrev();
            document.getElementById('btn-proximo').onclick = () => pageFlip.flipNext();

            // Setas do teclado
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') pageFlip.flipNext();
                if (e.key === 'ArrowLeft') pageFlip.flipPrev();
            });
        }, tempoRestante);

    } catch (erro) {
        console.error("Erro ao processar o pergaminho:", erro);
        avisoCarregando.classList.add('escondido');
        alert("Ocorreu um erro ao desdobrar as páginas do PDF.\n\n" + (erro && erro.message ? erro.message : erro));
    }
}

/* ==========================================
   Início
   ========================================== */
(async () => {
    try {
        const arquivo = await pegarPdf();
        if (!arquivo) {
            alert("Nenhum pergaminho selecionado!");
            window.location.href = 'index.html';
            return;
        }
        const buffer = await arquivo.arrayBuffer();
        const chavePagina = 'pagina:' + arquivo.name + ':' + arquivo.size;
        carregarEConverterPdf({ data: buffer }, chavePagina);
    } catch (erro) {
        console.error("Erro ao ler o pergaminho salvo:", erro);
        alert("Não foi possível abrir o pergaminho salvo.");
    }
})();