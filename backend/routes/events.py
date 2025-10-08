from fastapi import APIRouter
from utils.game_loader import GameLoader

router = APIRouter()
@router.get("/events")
def get_all_events():
    game_loader = GameLoader()
    # self.events est un dict → on veut une liste de valeurs
    events_list = list(game_loader.events.values())
    return events_list