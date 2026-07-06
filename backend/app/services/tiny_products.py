import httpx

TINY_API_BASE = "https://api.tiny.com.br/public-api/v3"
BARUERI_DEPOSITO_NAME = "barueri"


class TinyProductLookupResult:
    def __init__(self, sku: str):
        self.sku = sku
        self.encontrado = False
        self.marca: str | None = None
        self.descricao: str | None = None
        self.peso: float | None = None
        self.custo: float | None = None
        self.custo_medio: float | None = None
        self.preco_sugerido: float | None = None
        self.estoque_barueri: float | None = None
        self.erro: str | None = None

    def to_dict(self) -> dict:
        return {
            "sku": self.sku,
            "encontrado": self.encontrado,
            "marca": self.marca,
            "descricao": self.descricao,
            "peso": self.peso,
            "custo": self.custo,
            "preco_sugerido": self.preco_sugerido,
            "custo_medio": self.custo_medio,
            "estoque_barueri": self.estoque_barueri,
            "erro": self.erro,
        }


def _auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def _find_product_id(client: httpx.Client, headers: dict, sku: str) -> int | None:
    resp = client.get(f"{TINY_API_BASE}/produtos", headers=headers, params={"codigo": sku})
    resp.raise_for_status()
    itens = resp.json().get("itens", [])
    for item in itens:
        if item.get("sku", "").strip().lower() == sku.strip().lower():
            return item["id"]
    return itens[0]["id"] if itens else None


def _get_estoque_barueri(client: httpx.Client, headers: dict, produto_id: int) -> float | None:
    resp = client.get(f"{TINY_API_BASE}/estoque/{produto_id}", headers=headers)
    resp.raise_for_status()
    depositos = resp.json().get("depositos", [])
    for deposito in depositos:
        if BARUERI_DEPOSITO_NAME in deposito.get("nome", "").strip().lower():
            return deposito.get("disponivel")
    return None


def lookup_sku(client: httpx.Client, access_token: str, sku: str) -> TinyProductLookupResult:
    result = TinyProductLookupResult(sku)
    headers = _auth_headers(access_token)

    try:
        produto_id = _find_product_id(client, headers, sku)
        if produto_id is None:
            result.erro = "SKU nao encontrado no Tiny"
            return result

        detalhe = client.get(f"{TINY_API_BASE}/produtos/{produto_id}", headers=headers)
        detalhe.raise_for_status()
        data = detalhe.json()

        result.encontrado = True
        result.marca = (data.get("marca") or {}).get("nome")
        result.descricao = data.get("descricao")
        result.peso = (data.get("dimensoes") or {}).get("pesoLiquido")
        precos = data.get("precos") or {}
        result.custo = precos.get("precoCusto")
        result.custo_medio = precos.get("precoCustoMedio")

        result.estoque_barueri = _get_estoque_barueri(client, headers, produto_id)
    except httpx.HTTPStatusError as exc:
        result.erro = f"Erro Tiny ({exc.response.status_code})"
    except httpx.HTTPError:
        result.erro = "Falha de comunicacao com o Tiny"

    return result


def lookup_skus(access_token: str, skus: list[str]) -> list[TinyProductLookupResult]:
    with httpx.Client(timeout=15) as client:
        return [lookup_sku(client, access_token, sku) for sku in skus]
