const inputArquivo = document.getElementById('input-arquivo');
const mensagemStatus = document.getElementById('mensagem-status');
const cartao = document.querySelector('.livro-pergaminho');

inputArquivo.addEventListener('change', function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    mensagemStatus.textContent = "📜 Pergaminho desdobrado: " + arquivo.name;

    const req = indexedDB.open('reduto', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('pdfs');
    req.onerror = () => {
        mensagemStatus.textContent = "Não foi possível guardar o pergaminho.";
    };
    req.onsuccess = () => {
        const tx = req.result.transaction('pdfs', 'readwrite');
        tx.objectStore('pdfs').put(arquivo, 'atual');
        tx.oncomplete = () => {
            setTimeout(() => cartao.classList.add('saindo'), 600);
            setTimeout(() => window.open('leitor.html', '_blank'), 1300);
        };
    };
});

const fundo = document.querySelector('.fundo-animado');
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * -24;
    const y = (e.clientY / window.innerHeight - 0.5) * -24;
    fundo.style.translate = x + 'px ' + y + 'px';
});

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

    const vagalumes = Array.from({ length: 50 }, () => ({
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

            const brilho = (Math.sin(v.fase) + 1) / 2;
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