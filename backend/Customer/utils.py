# utils.py
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

signer = TimestampSigner()

def generate_email_token(email):
    return signer.sign(email)

def verify_email_token(token, max_age=86400):  # 1 day expiry
    try:
        return signer.unsign(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
