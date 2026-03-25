from helpers.api import ApiHandler, Input, Output, Request, Response
from usr.plugins.favorite_chats.helpers.favorites import toggle_favorite


class ToggleFavorite(ApiHandler):
    """Toggle favorite status for a chat."""

    async def process(self, input: Input, request: Request) -> Output:
        chat_id = input.get("chat_id", "")
        if not chat_id:
            return Response("Missing chat_id", 400)

        favorited, timestamp = toggle_favorite(chat_id)

        return {
            "ok": True,
            "favorited": favorited,
            "chat_id": chat_id,
            "timestamp": timestamp,
        }
