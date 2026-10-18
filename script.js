const inputArquivo = document.getElementById('input-arquivo');
const mensagemStatus = document.getElementById('mensagem-status');

inputArquivo.addEventListener('change', function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    mensagemStatus.textContent = "📜 Pergaminho desdobrado: " + arquivo.name;

    // Guarda o arquivo em si (não a URL blob) no IndexedDB
    const req = indexedDB.open('reduto', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('pdfs');
    req.onerror = () => {
        mensagemStatus.textContent = "Não foi possível guardar o pergaminho.";
    };
    req.onsuccess = () => {
        const tx = req.result.transaction('pdfs', 'readwrite');
        tx.objectStore('pdfs').put(arquivo, 'atual');
        tx.oncomplete = () => {
            setTimeout(function () {
                window.open('leitor.html', '_blank');
            }, 1000);
        };
    };
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') pageFlip.flipNext();
    if (e.key === 'ArrowLeft')  pageFlip.flipPrev();
});