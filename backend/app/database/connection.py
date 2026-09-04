import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = MongoDB()

async def connect_to_mongo():
    """Establishes connection to MongoDB or Atlas and configures indexes."""
    if settings.ENVIRONMENT.lower() == "testing":
        logger.info("Testing environment: using in-memory data stores.")
        return
    try:
        logger.info("Connecting to configured MongoDB instance")
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")

        # Create indexes
        users_col = db_instance.db["users"]
        await users_col.create_index("email", unique=True)
        
        calls_col = db_instance.db["calls"]
        await calls_col.create_index("user_id")
        await calls_col.create_index("created_at")
        await calls_col.create_index([("user_id", 1), ("created_at", -1)])

        alerts_col = db_instance.db["alerts"]
        await alerts_col.create_index("user_id")
        await alerts_col.create_index("call_id")
        await alerts_col.create_index("status")
        await alerts_col.create_index([("user_id", 1), ("created_at", -1)])

    except Exception as e:
        logger.warning(f"MongoDB connection warning (will retry upon requests or continue with mock fallback): {e}")

async def close_mongo_connection():
    """Closes MongoDB connection pool."""
    if db_instance.client:
        logger.info("Closing MongoDB connection pool.")
        db_instance.client.close()
    db_instance.client = None
    db_instance.db = None

def get_database() -> AsyncIOMotorDatabase:
    """Returns current active database instance."""
    return db_instance.db
