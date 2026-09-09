from decouple import config

def set_auth_cookies(response, access_token, refresh_token):
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