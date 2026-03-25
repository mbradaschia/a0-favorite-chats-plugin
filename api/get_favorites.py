from helpers.api import ApiHandler, Input, Output, Request, Response
from usr.plugins.favorite_chats.helpers.favorites import get_favorites


class GetFavorites(ApiHandler):
    """Return all favorited chat IDs and their timestamps."""

    async def process(self, input: Input, request: Request) -> Output:
        favorites = get_favorites()
        return {
            "ok": True,
            "favorites": favorites,
        }
