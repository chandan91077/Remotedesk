from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import httpx
import hmac
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT settings
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXPIRATION = int(os.environ['JWT_EXPIRATION_MINUTES'])

# DevCraftor settings
DEVCRAFTOR_API_KEY = os.environ['DEVCRAFTOR_API_KEY']
DEVCRAFTOR_API_SECRET = os.environ['DEVCRAFTOR_API_SECRET']
DEVCRAFTOR_BASE_URL = os.environ['DEVCRAFTOR_BASE_URL']
WEBHOOK_SECRET = os.environ['WEBHOOK_SECRET']
PRICE_PER_DAY = float(os.environ['PRICE_PER_DAY'])

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeviceRegister(BaseModel):
    mac_address: str
    cpu_id: str
    hostname: str
    os_version: Optional[str] = None

class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    device_name: Optional[str] = None
    mac_hash: str
    cpu_id: str
    hostname: str
    os_version: Optional[str] = None
    device_secret: str
    online: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionCreate(BaseModel):
    duration_days: int = Field(gt=0, le=365)

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    duration_days: int
    amount: float
    status: str = "pending"
    payment_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subscription_id: str
    amount: float
    status: str = "pending"
    payment_link_url: Optional[str] = None
    devcraftor_reference: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    device_id: str
    user_id: str
    admin_id: Optional[str] = None
    status: str = "active"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = None

# ============= HELPERS =============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION)
    data.update({"exp": expire})
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def calculate_price(days: int) -> float:
    base_price = days * PRICE_PER_DAY
    if days >= 180:
        return base_price * 0.85
    elif days >= 90:
        return base_price * 0.90
    elif days >= 30:
        return base_price * 0.95
    return base_price

def create_mac_hash(mac: str) -> str:
    return hashlib.sha256(mac.encode()).hexdigest()

def generate_device_secret() -> str:
    return hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:32]

# ============= AUTH ROUTES =============
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    token = create_jwt({"sub": user_dict["id"], "email": user_dict["email"]})
    
    return {
        "access_token": token,
        "user": {"id": user_dict["id"], "email": user_dict["email"], "name": user_dict["name"], "role": user_dict["role"]}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt({"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    subscription = await db.subscriptions.find_one(
        {"user_id": user["id"], "status": "active"},
        {"_id": 0}
    )
    return {**user, "subscription": subscription}

# ============= DEVICE ROUTES =============
@api_router.post("/device/register")
async def register_device(data: DeviceRegister, user: dict = Depends(get_current_user)):
    subscription = await db.subscriptions.find_one(
        {"user_id": user["id"], "status": "active"}
    )
    
    device_count = await db.devices.count_documents({"user_id": user["id"]})
    max_devices = 10 if subscription else 1
    
    if device_count >= max_devices:
        raise HTTPException(status_code=403, detail=f"Device limit reached ({max_devices} devices)")
    
    mac_hash = create_mac_hash(data.mac_address)
    existing = await db.devices.find_one({"mac_hash": mac_hash})
    if existing:
        raise HTTPException(status_code=400, detail="Device already registered")
    
    device_secret = generate_device_secret()
    device_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mac_hash": mac_hash,
        "cpu_id": data.cpu_id,
        "hostname": data.hostname,
        "os_version": data.os_version,
        "device_secret": device_secret,
        "online": True,
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.devices.insert_one(device_dict)
    return {"device_id": device_dict["id"], "device_secret": device_secret}

@api_router.get("/device/list")
async def list_devices(user: dict = Depends(get_current_user)):
    devices = await db.devices.find({"user_id": user["id"]}, {"_id": 0, "device_secret": 0}).to_list(100)
    return devices

@api_router.delete("/device/{device_id}")
async def delete_device(device_id: str, user: dict = Depends(get_current_user)):
    result = await db.devices.delete_one({"id": device_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted"}

@api_router.post("/device/heartbeat")
async def device_heartbeat(device_id: str, device_secret: str):
    device = await db.devices.find_one({"id": device_id, "device_secret": device_secret})
    if not device:
        raise HTTPException(status_code=401, detail="Invalid device credentials")
    
    await db.devices.update_one(
        {"id": device_id},
        {"$set": {"online": True, "last_seen": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "ok"}

# ============= SUBSCRIPTION/PAYMENT ROUTES =============
@api_router.post("/subscription/calculate")
async def calculate_subscription_price(data: SubscriptionCreate):
    price = calculate_price(data.duration_days)
    return {"duration_days": data.duration_days, "amount": round(price, 2)}

@api_router.post("/subscription/create")
async def create_subscription(data: SubscriptionCreate, user: dict = Depends(get_current_user)):
    price = calculate_price(data.duration_days)
    
    subscription_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "duration_days": data.duration_days,
        "amount": round(price, 2),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(subscription_dict)
    
    devcraftor_ref = f"sub_{subscription_dict['id']}_{int(datetime.now(timezone.utc).timestamp())}"
    
    payment_dict = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "subscription_id": subscription_dict["id"],
        "amount": subscription_dict["amount"],
        "status": "pending",
        "devcraftor_reference": devcraftor_ref,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{DEVCRAFTOR_BASE_URL}/v2/partner/payment_links",
                json={
                    "amount": int(subscription_dict["amount"] * 100),
                    "currency": "USD",
                    "description": f"RemoteDesk Pro - {data.duration_days} days subscription",
                    "customer_email": user["email"],
                    "return_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment/success",
                    "webhook_url": f"{os.environ.get('BACKEND_URL', 'http://localhost:8001')}/api/webhook/devcraftor",
                    "metadata": {
                        "user_id": user["id"],
                        "subscription_id": subscription_dict["id"],
                        "reference": devcraftor_ref
                    }
                },
                headers={
                    "X-API-Key": DEVCRAFTOR_API_KEY,
                    "X-API-Secret": DEVCRAFTOR_API_SECRET,
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                payment_data = response.json()
                payment_dict["payment_link_url"] = payment_data.get("payment_url", "")
            else:
                payment_dict["payment_link_url"] = f"https://pay.devcraftor.com/demo/{devcraftor_ref}"
        except Exception as e:
            logging.error(f"DevCraftor API error: {e}")
            payment_dict["payment_link_url"] = f"https://pay.devcraftor.com/demo/{devcraftor_ref}"
    
    await db.payments.insert_one(payment_dict)
    return {
        "subscription_id": subscription_dict["id"],
        "payment_id": payment_dict["id"],
        "amount": subscription_dict["amount"],
        "payment_url": payment_dict["payment_link_url"]
    }

@api_router.post("/webhook/devcraftor")
async def webhook_devcraftor(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("X-DevCraftor-Signature", "")
    
    expected_sig = hmac.new(WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(expected_sig, signature):
        logging.warning("Invalid webhook signature")
    
    try:
        payload = await request.json()
        reference = payload.get("reference", "")
        payment_status = payload.get("status", "")
        
        payment = await db.payments.find_one({"devcraftor_reference": reference})
        if not payment:
            return {"status": "not_found"}
        
        if payment_status == "completed" or payment_status == "SUCCESS":
            await db.payments.update_one(
                {"id": payment["id"]},
                {"$set": {"status": "completed"}}
            )
            
            subscription = await db.subscriptions.find_one({"id": payment["subscription_id"]})
            if subscription:
                start_date = datetime.now(timezone.utc)
                end_date = start_date + timedelta(days=subscription["duration_days"])
                
                await db.subscriptions.update_one(
                    {"id": subscription["id"]},
                    {"$set": {
                        "status": "active",
                        "payment_id": payment["id"],
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat()
                    }}
                )
        elif payment_status == "failed":
            await db.payments.update_one(
                {"id": payment["id"]},
                {"$set": {"status": "failed"}}
            )
            await db.subscriptions.update_one(
                {"id": payment["subscription_id"]},
                {"$set": {"status": "failed"}}
            )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook processing error: {e}")
        return {"status": "error"}

@api_router.get("/payment/{payment_id}/status")
async def get_payment_status(payment_id: str, user: dict = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id, "user_id": user["id"]}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

# ============= SESSION ROUTES =============
@api_router.post("/session/start")
async def start_session(device_id: str, user: dict = Depends(get_current_user)):
    device = await db.devices.find_one({"id": device_id, "user_id": user["id"]})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if not device.get("online"):
        raise HTTPException(status_code=400, detail="Device is offline")
    
    session_dict = {
        "id": str(uuid.uuid4()),
        "session_id": f"sess_{str(uuid.uuid4())[:8]}",
        "device_id": device_id,
        "user_id": user["id"],
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_dict)
    
    return {"session_id": session_dict["session_id"], "device_id": device_id}

@api_router.post("/session/{session_id}/end")
async def end_session(session_id: str, user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"session_id": session_id, "user_id": user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Session ended"}

@api_router.get("/session/list")
async def list_sessions(user: dict = Depends(get_current_user)):
    sessions = await db.sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("started_at", -1).to_list(50)
    return sessions

# ============= ADMIN ROUTES =============
@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    active_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    online_devices = await db.devices.count_documents({"online": True})
    active_sessions = await db.sessions.count_documents({"status": "active"})
    
    return {
        "total_users": total_users,
        "active_subscriptions": active_subscriptions,
        "online_devices": online_devices,
        "active_sessions": active_sessions
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/sessions")
async def get_all_sessions(admin: dict = Depends(get_admin_user)):
    sessions = await db.sessions.find({}, {"_id": 0}).sort("started_at", -1).to_list(200)
    return sessions

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
