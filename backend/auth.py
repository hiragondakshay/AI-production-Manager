import os
from datetime import datetime, timedelta
from typing import Optional, List
import jwt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-manufacturing-key-2026")
# Ensure secret key is not default in production
if ENVIRONMENT == "production" and SECRET_KEY == "super-secret-manufacturing-key-2026":
    raise RuntimeError("SECRET_KEY must be set to a strong value in production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

import bcrypt

# New bcrypt hashing for new users
def hash_password_bcrypt(password: str) -> str:
    # bcrypt automatically handles salt
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

# Legacy SHA-256 hashing for backward compatibility
def hash_password_sha256(password: str) -> str:
    salt = "factory_salt_9981"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def hash_password(password: str) -> str:
    """Hash password using bcrypt for new accounts, fallback to legacy SHA-256.
    The function selects bcrypt as the preferred method. Existing accounts retain SHA-256 hashes.
    """
    return hash_password_bcrypt(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password supporting both bcrypt and legacy SHA-256 hashes.
    bcrypt hashes start with $2b$ or $2a$; otherwise, treat as SHA-256.
    """
    if hashed_password.startswith("$2"):
        # bcrypt hash
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    else:
        # legacy SHA-256 hash
        return hash_password_sha256(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}"
            )
        return user
    return role_checker
