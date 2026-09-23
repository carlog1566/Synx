from decouple import config

def set_auth_cookies(response, access_token, refresh_token):
    """
    Helper function to set the user's JWT auth cookies when logging in.

    Takes newly created JWT tokens and assigns them to the user via secure HTTP-only cookies. Cookie 
    settings adapt to environment: samesite is 'Lax' locally (frontend and backend share localhost) 
    but must be 'None' in production, since frontend and backend live on different domains 
    (Vercel/Railway) and 'Lax' would silently block the cookies from being sent cross-site. 'None' 
    requires secure=True, which is why both change together based on DEBUG.
    
    Parameters
    ----------
    response : rest_framework.response.Response
        The response object to attatch cookies to.
    access_token : str
        A newly created JWT authentication token that will be assigned to the user via a secure
        HTTP-only cookie.
    refresh_token : str
        A newly created JWT refresh token that will be assigned to the user via a secure HTTP-only
        cookie.
    """

    is_production = not config('DEBUG', default=True, cast=bool)

    cookie_kwargs = {
        'httponly': True,
        'secure': is_production,
        'samesite': 'None' if is_production else 'Lax',
    }

    response.set_cookie(
        key='access_token', 
        value=str(access_token), 
        max_age=3600, 
        **cookie_kwargs
    )

    response.set_cookie(
        key='refresh_token', 
        value=str(refresh_token), 
        max_age=604800, 
        **cookie_kwargs
    )