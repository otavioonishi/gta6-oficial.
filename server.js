const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── CREDENCIAIS MISTICPAY ───
const CLIENT_ID     = 'ci_af2doqoe0d1cm1y';
const CLIENT_SECRET = 'cs_ye0tff4frh8tktkpv7hrakfpo';
const API_BASE      = 'https://api.misticpay.com/api';

// ─── CREDENCIAIS SUPABASE ───
const SUPABASE_URL  = 'https://odsasdyhctctdasssmdx.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kc2FzZHloY3RjdGRhc3NzbWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc2MDcyMCwiZXhwIjoyMDk4MzM2NzIwfQ.pef91n5qXXdcqWBtHZV_Pie-XbmOflaznM03JHBZeCA';
const supabase      = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── GERAR PIX ───
app.post('/criar-pix', async (req, res) => {
    const {
        nome,
        cpf,
        email,
        telefone,
        valor
    } = req.body;

    if (!nome || !cpf || !email || !telefone || !valor) {
        return res.status(400).json({
            erro: 'Nome, CPF, e-mail, telefone e valor são obrigatórios.'
        });
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
        return res.status(400).json({
            erro: 'CPF inválido.'
        });
    }

    if (String(telefone).replace(/\D/g, '').length !== 11) {
        return res.status(400).json({
            erro: 'Telefone inválido.'
        });
    }

    const transactionId = 'GTA6-' + Date.now();

    // resto do código..

    try {
        const response = await fetch(`${API_BASE}/transactions/create`, {
            method: 'POST',
            headers: {
                'ci': CLIENT_ID,
                'cs': CLIENT_SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: parseFloat(valor),
                payerName: nome,
                payerDocument: cpf.replace(/\D/g, ''),
                transactionId: transactionId,
                description: 'GTA 6 - Edição Standard'
            })
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch(e) {
            return res.status(500).json({ erro: 'Resposta inválida da MisticPay.' });
        }

        if (!response.ok) {
            return res.status(400).json({ erro: data.message || data.error || 'Erro ao gerar PIX.' });
        }

        const d = data.data || data;

        // ─── SALVAR PEDIDO NO SUPABASE ───
       const { error: dbError } = await supabase.from('pedidos').insert({
    transaction_id: d.transactionId,
    nome: nome,
    cpf: cpf.replace(/\D/g, ''),
    email: email,
    telefone: telefone,
    valor: parseFloat(valor),
    status: 'PENDENTE',
    qr_code_text: d.copyPaste,
    criado_em: new Date().toISOString()
});
        if (dbError) {
            console.error('Erro ao salvar no Supabase:', dbError.message);
        } else {
            console.log('✅ Pedido salvo no Supabase:', d.transactionId);
        }

        res.json({
            transactionId: d.transactionId,
            qrCode:        d.qrcodeUrl,
            qrCodeText:    d.copyPaste,
        });

    } catch (err) {
        console.error('Erro criar PIX:', err);
        res.status(500).json({ erro: 'Erro interno ao gerar PIX.' });
    }
});

// ─── VERIFICAR PIX ───
app.get('/verificar-pix/:transactionId', async (req, res) => {
    const { transactionId } = req.params;

    try {
        const response = await fetch(`${API_BASE}/transactions/verify/${transactionId}`, {
            method: 'GET',
            headers: {
                'ci': CLIENT_ID,
                'cs': CLIENT_SECRET,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch(e) {
            return res.json({ pago: false, status: 'pending' });
        }

        const d = data.data || data;
        const status = d.transactionState || d.status || '';
        const pago = ['PAGO', 'CONCLUIDO', 'PAID', 'COMPLETED', 'APPROVED'].includes(status.toUpperCase());

        // ─── ATUALIZAR STATUS NO SUPABASE ───
        if (pago) {
            const { error } = await supabase
                .from('pedidos')
                .update({ status: 'PAGO' })
                .eq('transaction_id', transactionId);

            if (error) {
                console.error('Erro ao atualizar status:', error.message);
            } else {
                console.log('✅ Pedido atualizado para PAGO:', transactionId);
            }
        }

        res.json({ status, pago });

    } catch (err) {
        console.error('Erro verificar PIX:', err.message);
        res.json({ pago: false, status: 'pending' });
    }
});

// ─── LISTAR PEDIDOS (para o dashboard) ───
app.get('/pedidos', async (req, res) => {
    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        return res.status(500).json({ erro: error.message });
    }

    res.json(data);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`🎮 Abra http://localhost:${PORT}/pagamento.html no navegador`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
});