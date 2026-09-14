from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class OfflineSyncEvent(BaseModel):
    local_event_id: str
    event_type: str  # SOS_TRIGGER, HAZARD_REPORT, BREADCRUMB, IDENTITY_VERIFICATION
    payload: Dict[str, Any]
    client_timestamp: str

class SyncBatchRequest(BaseModel):
    device_id: str
    events: List[OfflineSyncEvent]

class SyncEventResult(BaseModel):
    local_event_id: str
    status: str  # SYNCED, DUPLICATE_IGNORED, FAILED
    server_id: Optional[str] = None
    message: Optional[str] = None

class SyncBatchResponse(BaseModel):
    success: bool
    synced_count: int
    duplicates_count: int
    failed_count: int
    results: List[SyncEventResult]
