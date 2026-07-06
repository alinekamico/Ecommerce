# KAMI CO. Ecommerce

Sistema de ecommerce da KAMI CO., seguindo o padrao de governanca de TI da empresa (stack, seguranca e fluxo de deploy).

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Python + FastAPI
- **Banco de dados:** MySQL (RDS na AWS em producao)
- **Autenticacao:** JWT + senha com hash bcrypt
- **Hospedagem:** EC2 (AWS)

## Estrutura

```
backend/    API FastAPI (auth, usuarios, futuramente catalogo/pedidos)
frontend/   Aplicacao Next.js
```

## Rodando localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env        # preencha com suas credenciais locais
alembic revision --autogenerate -m "init"
alembic upgrade head
uvicorn app.main:app --reload
```

API disponivel em `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicacao disponivel em `http://localhost:3000`.

Crie um `frontend/.env.local` com:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Paleta de cores (Brandbook KAMI CO.)

| Cor | Hex |
|---|---|
| Vermelho principal | `#E2032A` |
| Vermelho claro (hover) | `#EF3454` |
| Neutro escuro | `#463D3F` |
| Neutro claro / fundo | `#EFEDE8` |
| Cinza secundario | `#D8D8D8` |

Disponiveis no Tailwind como `bg-kami-red`, `text-kami-dark`, `bg-kami-cream`, `border-kami-gray`, etc.
