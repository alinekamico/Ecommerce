from pydantic import BaseModel, Field


class TinySkuLookupRequest(BaseModel):
    skus: list[str] = Field(min_length=1, max_length=100)


class TinySkuLookupResult(BaseModel):
    sku: str
    encontrado: bool
    marca: str | None = None
    descricao: str | None = None
    peso: float | None = None
    custo: float | None = None
    preco_sugerido: float | None = None
    custo_medio: float | None = None
    estoque_barueri: float | None = None
    erro: str | None = None


class TinySkuLookupResponse(BaseModel):
    resultados: list[TinySkuLookupResult]
