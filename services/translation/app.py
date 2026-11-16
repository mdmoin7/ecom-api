import os
import secrets
from contextlib import asynccontextmanager
from threading import Lock
from typing import Literal

import torch
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor

MODEL_NAME = os.getenv("INDICTRANS_MODEL", "ai4bharat/indictrans2-en-indic-dist-200M")
SERVICE_TOKEN = os.getenv("TRANSLATION_SERVICE_TOKEN", "")
HF_TOKEN = os.getenv("HF_TOKEN") or None
DEVICE = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
LANGUAGES = {
    "hi": "hin_Deva", "bn": "ben_Beng", "te": "tel_Telu", "mr": "mar_Deva",
    "ta": "tam_Taml", "gu": "guj_Gujr", "kn": "kan_Knda", "ml": "mal_Mlym",
    "pa": "pan_Guru", "or": "ory_Orya", "as": "asm_Beng", "ur": "urd_Arab",
}
MAX_ITEMS = 100
MAX_CHARACTERS = 30000
model = tokenizer = processor = None
model_lock = Lock()


class TranslationRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=MAX_ITEMS)
    target_language: Literal["hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "or", "as", "ur"]


class TranslationResponse(BaseModel):
    translations: list[str]
    model: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model, tokenizer, processor
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True, token=HF_TOKEN)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True, token=HF_TOKEN)
    model.to(DEVICE)
    model.eval()
    processor = IndicProcessor(inference=True)
    yield
    model = tokenizer = processor = None


app = FastAPI(title="Ecom IndicTrans2 Translation API", version="1.0.0", lifespan=lifespan)


def authenticate(authorization: str | None) -> None:
    if not SERVICE_TOKEN:
        raise HTTPException(status_code=503, detail="Translation service token is not configured")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not secrets.compare_digest(supplied, SERVICE_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"status": "ok" if model is not None else "loading", "model": MODEL_NAME, "device": DEVICE}


@app.post("/translate", response_model=TranslationResponse)
@app.post("/api/v1/translate", response_model=TranslationResponse)
def translate(payload: TranslationRequest, authorization: str | None = Header(default=None)):
    authenticate(authorization)
    if model is None or tokenizer is None or processor is None:
        raise HTTPException(status_code=503, detail="Translation model is loading")
    if any(not text.strip() or len(text) > 5000 for text in payload.texts):
        raise HTTPException(status_code=422, detail="Texts must be non-empty and at most 5,000 characters")
    if sum(len(text) for text in payload.texts) > MAX_CHARACTERS:
        raise HTTPException(status_code=413, detail="Batch exceeds the 30,000-character limit")

    target = LANGUAGES[payload.target_language]
    with model_lock, torch.inference_mode():
        prepared = processor.preprocess_batch(payload.texts, src_lang="eng_Latn", tgt_lang=target, visualize=False)
        inputs = tokenizer(prepared, truncation=True, max_length=512, padding="longest",
                           return_tensors="pt", return_attention_mask=True).to(DEVICE)
        generated = model.generate(**inputs, use_cache=True, min_length=0, max_length=256,
                                   num_beams=4, num_return_sequences=1)
        decoded = tokenizer.batch_decode(generated, skip_special_tokens=True,
                                          clean_up_tokenization_spaces=True)
        translations = processor.postprocess_batch(decoded, lang=target)
    if len(translations) != len(payload.texts):
        raise HTTPException(status_code=502, detail="Model returned an incomplete translation batch")
    return TranslationResponse(translations=translations, model=MODEL_NAME)
