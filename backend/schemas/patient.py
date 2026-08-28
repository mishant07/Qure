from pydantic import BaseModel

class PredictRequest(BaseModel):
    dataset: str
    features: dict
