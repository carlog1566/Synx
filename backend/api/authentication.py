from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticates requests using the JWT stored in the access_token httpOnly cookie, rather
    than an Authorization header.

    Registered as DEFAULT_AUTHENTICATION_CLASSES in settings.py, so every view using
    IsAuthenticated goes through this automatically.
    """

    def authenticate(self, request):
        """
        Validate the access_token cookie and identify the requesting user.

        Parameters
        ----------
        request : rest_framework.request.Request
            The incoming request, expected to carry an access_token cookie if the user
            is logged in.

        Returns
        -------
        tuple or None
            (user, validated_token) if a valid access_token cookie is present, following DRF's
            authentication contract. Returns None if no cookie is present at all, signaling to
            DRF that this authentication method doesn't apply here.
        """

        raw_token = request.COOKIES.get('access_token')

        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)

        user = self.get_user(validated_token)

        return (user, validated_token)