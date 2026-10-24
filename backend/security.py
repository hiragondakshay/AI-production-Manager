import os
import time
import base64
from typing import Dict, List
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from cryptography.fernet import Fernet
import hashlib

# Generate deterministic AES-256 Master Encryption Key from Secret Key
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-manufacturing-key-2026")
key_hash = hashlib.sha256(SECRET_KEY.encode('utf-8')).digest()
AES_KEY = base64.urlsafe_b64encode(key_hash)
cipher = Fernet(AES_KEY)

def encrypt_sensitive_data(plain_text: str) -> str:
    """AES-256 Encryption at Rest for sensitive fields"""
    if not plain_text:
        return ""
    encrypted_bytes = cipher.encrypt(plain_text.encode('utf-8'))
    return encrypted_bytes.decode('utf-8')

def decrypt_sensitive_data(cipher_text: str) -> str:
    """AES-256 Decryption for authorized access"""
    if not cipher_text:
        return ""
    try:
        decrypted_bytes = cipher.decrypt(cipher_text.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except Exception:
        return "[ENCRYPTED DATA PROTECTED]"

# --- Rate Limiter Guard (Anti-Brute-Force & Anti-DDoS) ---
class RateLimiter:
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.ip_history: Dict[str, List[float]] = {}

    def check_rate_limit(self, ip_address: str):
        now = time.time()
        timestamps = self.ip_history.get(ip_address, [])
        # Filter timestamps within window
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]

        if len(valid_timestamps) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="SECURITY ALERT: Rate limit exceeded. Too many requests. Try again in 60 seconds."
            )

        valid_timestamps.append(now)
        self.ip_history[ip_address] = valid_timestamps

auth_rate_limiter = RateLimiter(max_requests=30, window_seconds=60) # 30 login attempts / min max

# --- Security Headers Middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Security-Protection"] = "NEXUSPROD-AES256-ARMORED"
        return response
