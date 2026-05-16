from typing import TypedDict, Optional, List, Any
from datetime import datetime

class AgentState(TypedDict):
    user_id: str
    user_message: str
    intent: Optional[str]
    raw_transactions: Optional[List[dict]]
    analysis: Optional[dict]
    behavioral_profile: Optional[dict]
    rag_context: Optional[str]
    coach_response: Optional[str]
    final_response: Optional[str]
    error: Optional[str]
    steps_taken: List[str]
