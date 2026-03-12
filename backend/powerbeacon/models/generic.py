from sqlmodel import SQLModel


# Generic message
class Message(SQLModel):
    message: str


# Generic error response
class ErrorResponse(SQLModel):
    status_code: int
    message: str
    details: str | None = None


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None
