from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.data_analyst import data_analyst_node
from app.agents.financial_coach import financial_coach_node
from app.agents.behavioral_profiler import behavioral_profiler_node
from app.agents.reporting import reporting_node

def route_intent(state: AgentState) -> str:
    intent = state.get("intent", "general")
    if intent in ["spending_analysis", "overspending"]:
        return "behavioral_profiler"
    elif intent in ["goal_planning", "savings_advice"]:
        return "financial_coach"
    elif intent in ["reporting", "score"]:
        return "reporting"
    else:
        return "financial_coach"

def build_graph(db) -> StateGraph:
    async def _data_analyst(s: AgentState) -> AgentState:
        return await data_analyst_node(s, db)

    async def _behavioral_profiler(s: AgentState) -> AgentState:
        return await behavioral_profiler_node(s, db)

    async def _financial_coach(s: AgentState) -> AgentState:
        return await financial_coach_node(s, db)

    async def _reporting(s: AgentState) -> AgentState:
        return await reporting_node(s, db)

    graph = StateGraph(AgentState)
    graph.add_node("data_analyst", _data_analyst)
    graph.add_node("behavioral_profiler", _behavioral_profiler)
    graph.add_node("financial_coach", _financial_coach)
    graph.add_node("reporting", _reporting)

    graph.set_entry_point("data_analyst")

    graph.add_conditional_edges(
        "data_analyst",
        route_intent,
        {
            "behavioral_profiler": "behavioral_profiler",
            "financial_coach": "financial_coach",
            "reporting": "reporting",
        }
    )

    graph.add_edge("behavioral_profiler", "financial_coach")
    graph.add_edge("financial_coach", END)
    graph.add_edge("reporting", END)

    return graph.compile()
