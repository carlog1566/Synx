from rest_framework.throttling import AnonRateThrottle

class RegisterThrottle(AnonRateThrottle):
    """
    Rate limits account registration attemtps by IP address, to prevent automated bot scripts from
    mass-creating accounts.
    """
    scope = 'register'