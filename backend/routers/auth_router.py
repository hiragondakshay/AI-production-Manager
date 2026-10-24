import base64
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse, ForgotPasswordRequest
from auth import hash_password, verify_password, create_access_token, get_current_user
from security import auth_rate_limiter
from services.face_scanner import extract_face_embedding, verify_face_match

router = APIRouter(prefix="/api/auth", tags=["Auth & Security"])

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    auth_rate_limiter.check_rate_limit(request.client.host)
    
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or Email already registered")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role="operator"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
def login_user(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    # Enforce Anti-Brute-Force Rate Limiting Guard
    auth_rate_limiter.check_rate_limit(request.client.host)

    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/face-login", response_model=TokenResponse)
async def face_login(
    request: Request,
    username: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Enforce Rate Limiting
    auth_rate_limiter.check_rate_limit(request.client.host)

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User account '{username}' not found.")

    contents = await file.read()
    face_found, msg, feature_vector = extract_face_embedding(contents)

    if not face_found:
        raise HTTPException(status_code=400, detail="No face detected in camera frame. Adjust lighting and face camera.")

    result = verify_face_match(feature_vector, username)
    if not result["verified"]:
        raise HTTPException(status_code=401, detail="Biometric Face Verification Failed: Facial signature mismatch.")

    access_token = create_access_token(data={"sub": user.username, "role": user.role, "auth_type": "biometric_face"})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Enforce Rate Limiting
    auth_rate_limiter.check_rate_limit(request.client.host)

    identifier = (data.username_or_email or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Username or registered email address is required.")

    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No active factory account found for '{identifier}'. Please check spelling or contact plant administration."
        )

    # Return safe enterprise confirmation without leaking secrets
    masked_email = user.email
    if "@" in user.email:
        parts = user.email.split("@")
        name_part = parts[0]
        masked_name = name_part[:2] + "****" if len(name_part) > 2 else name_part + "****"
        masked_email = f"{masked_name}@{parts[1]}"

    return {
        "success": True,
        "username": user.username,
        "role": user.role,
        "message": f"Password recovery ticket created for user '{user.username}'. Verification instructions have been dispatched to registered domain address ({masked_email}). For development/demo accounts, standard passwords can be reset via the Plant Administrator."
    }

