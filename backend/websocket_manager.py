import json
from typing import List, Dict, Any
from fastapi import WebSocket

class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message_type: str, data: Dict[str, Any]):
        message = {
            "type": message_type,
            "data": data
        }
        json_str = json.dumps(message, default=str)
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json_str)
            except Exception:
                to_remove.append(connection)

        for dead_conn in to_remove:
            self.disconnect(dead_conn)

ws_manager = WebSocketConnectionManager()
