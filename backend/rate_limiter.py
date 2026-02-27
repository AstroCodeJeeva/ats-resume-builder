"""
Shared rate-limiter instance (slowapi).
Import `limiter` wherever you need `@limiter.limit(...)` decorators.
Automatically disabled when MONGO_DB_NAME ends with '_test' (pytest).
"""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

_testing = os.getenv("MONGO_DB_NAME", "").endswith("_test")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
    enabled=not _testing,
)
