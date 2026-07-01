(function() {
    'use strict';

    const coverImage = document.getElementById('coverImage');
    const fallback = document.getElementById('placeholderFallback');
    const cover = document.getElementById('gameCover');
    const buyBtn = document.getElementById('buyButton');
    const toast = document.getElementById('toast');

    // ─── GERENCIAR PLACEHOLDER DA IMAGEM ───
    function checkImage() {
        const src = coverImage.getAttribute('src') || '';
        if (src.trim() !== '') {
            coverImage.style.display = 'block';
            fallback.style.display = 'none';
            coverImage.onerror = function() {
                coverImage.style.display = 'none';
                fallback.style.display = 'flex';
                fallback.querySelector('span').textContent =
                    '⚠️ Imagem não encontrada — edite o src no VS Code';
            };
        } else {
            coverImage.style.display = 'none';
            fallback.style.display = 'flex';
            fallback.querySelector('span').textContent =
                '🖼️ Clique para inserir a imagem (ou edite o src no VS Code)';
        }
    }

    // ao clicar no cover, abre um alerta educativo
    cover.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target === coverImage) return;
        alert(
            '📸 Para colocar a imagem:\n\n' +
            '1. Salve a imagem na pasta do projeto\n' +
            '2. No VS Code, edite a tag <img>:\n' +
            '   src="caminho/da/sua/imagem.jpg"\n\n' +
            'Ou clique em "Como editar?" no rodapé.'
        );
    });

    // ─── BOTÃO DE COMPRA ───
    buyBtn.addEventListener('click', function() {
        window.location.href = 'pagamento.html';
    });

    // ─── INICIALIZAR ───
    checkImage();

    window.__updateCover = function(src) {
        coverImage.setAttribute('src', src);
        checkImage();
    };

    console.log('✅ Site GTA 6 carregado!');
    console.log('📸 Para atualizar a capa: __updateCover("caminho/da/imagem")');
    console.log('✏️  Edite o arquivo no VS Code para personalizar.');
})();