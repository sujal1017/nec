from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, AllowAny
#token impports
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed

#models import
from .models import Customer
from .models import CustomerAddress
from .models import Subscriber
from .models import OTPVerification
from .models import AuthAuditLog
from Seller.models import SellerProfile
# from .models import CustomerPhoneNo

#form imports
from .forms import CustomerForm
from .forms import CustomerLoginForm
from .forms import CustomerUpdateProfileForm
from .forms import SubscriberForm
from .forms import PasswordResetForm, NewPasswordResetForm

from .forms import CustomerAddressEditForm
from .forms import CustomerAddressCreateForm
from .forms import CustomerAddressDeleteForm

# from .forms import CustomerPhoneForm
# from .forms import CustomerPhoneCreateForm
# from .forms import CustomerPhoneDeleteForm


#serializer import
from .serializers import CustomerSerializer
from .serializers import CustomerAddressSerializer
from .serializers import CustomerNamePhoneSerializer
from .serializers import RegisterCustomerSerializer

# from .serializers import CustomerPhoneSerializer

#for email verification
from django.core.mail import send_mail
from django.conf import settings
from urllib.parse import urlencode, urlsplit, urlunsplit
import logging
import secrets
# email verification imports removed — Keycloak handles email verification
from .keycloak import (
    create_keycloak_user,
    delete_keycloak_user,
    send_keycloak_verification_email,
    check_keycloak_email_verified,
    update_keycloak_email_verified,
    get_keycloak_user_status,
    assign_keycloak_role,
    find_keycloak_user_by_email,
)
from .services import (
    auth_verification_payload,
    ensure_keycloak_account_for_user,
    keycloak_role_for_customer,
    mark_user_email_verified_from_keycloak,
    sync_keycloak_verification,
)
import asyncio
import requests
import re
import random
from datetime import timedelta
from django.core.validators import validate_email

from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def serialize_auth_user(user):
    if user.keycloak_user_id:
        _sync_keycloak_verification(user)
        user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "user_status", "verification_timestamp"])
    return {
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "name": user.name,
        "phone": str(user.phoneno or ""),
        "avatar": user.avatar,
        "accountType": getattr(user, "account_type", "personal"),
        "businessName": getattr(user, "business_name", ""),
        "isVerified": user.is_verified,
        "userStatus": user.user_status,
        "emailVerified": bool(user.email_verified or user.is_verified),
        "verified": bool(user.email_verified or user.is_verified),
        "requiresEmailVerification": not bool(user.email_verified or user.is_verified),
        "requiresVerification": not bool(user.email_verified or user.is_verified),
    }


def generate_otp_code():
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def create_otp_for_user(user, attempts=0):
    return OTPVerification.objects.create(
        user=user,
        otp=generate_otp_code(),
        attempts=attempts,
        expires_at=OTPVerification.default_expiry(),
    )


def send_otp_email(user, otp_record):
    logger.info(
        "Using SMTP host=%s port=%s user=%s password_set=%s",
        settings.EMAIL_HOST,
        settings.EMAIL_PORT,
        settings.EMAIL_HOST_USER,
        bool(settings.EMAIL_HOST_PASSWORD),
    )
    send_mail(
        "Your verification OTP",
        f"Your verification OTP is {otp_record.otp}. It expires in 10 minutes.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    logger.info("OTP_SENT user_id=%s email=%s", user.id, user.email)


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def create_auth_audit_log(request, action, user=None):
    AuthAuditLog.objects.create(
        user=user,
        action=action,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

def build_keycloak_verification_redirect_uri(email):
    configured_redirect = (getattr(settings, "KEYCLOAK_VERIFICATION_REDIRECT_URI", "") or "").strip()
    if configured_redirect:
        return configured_redirect

    frontend_url = (getattr(settings, "FRONTEND_URL", "") or getattr(settings, "SITE_URL", "")).strip()
    if not frontend_url:
        raise RuntimeError("FRONTEND_URL or SITE_URL must be configured for Keycloak verification redirects")

    parsed = urlsplit(frontend_url.rstrip("/"))
    if not parsed.scheme or not parsed.netloc:
        raise RuntimeError("Configured frontend URL must be an absolute URL")

    return urlunsplit((parsed.scheme, parsed.netloc, "/verify-account", urlencode({"email": email}), ""))


class CustomerTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        _sync_keycloak_verification(user)
        user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "user_status", "verification_timestamp"])
        if user.user_status == Customer.STATUS_SUSPENDED:
            raise AuthenticationFailed("Account suspended")
        if user.user_status == Customer.STATUS_DELETED:
            raise AuthenticationFailed("Account deleted")
        data["token"] = data["access"]
        data["userType"] = getattr(self.user, "account_type", "personal")
        data["user"] = serialize_auth_user(self.user)
        data.update(auth_verification_payload(self.user))
        return data


class CustomerTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomerTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        attempted_user = Customer.objects.filter(username=username).first()
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, attempted_user)
            raise

        if response.status_code == status.HTTP_200_OK:
            create_auth_audit_log(request, AuthAuditLog.ACTION_LOGIN, attempted_user)
        return response

class LegacyRegisterCustomer(APIView):

    def post(self, request):
        

        form = CustomerForm(request.data)

        if form.is_valid():
            

            username = form.cleaned_data['username']
            email = form.cleaned_data['email']

            # âœ… uniqueness checks
            if Customer.objects.filter(username=username).exists():
   
                return Response({"msg": "Username is already used"}, status=400)

            if Customer.objects.filter(email=email).exists():
             
                return Response({"msg": "Email is already used"}, status=400)

            password = form.cleaned_data['password']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            name = form.cleaned_data['name']
            phoneno = form.cleaned_data['phoneno']
            account_type = form.cleaned_data.get('account_type') or request.data.get('userType') or request.data.get('accountType') or 'personal'
            account_type = 'business' if str(account_type).lower() in ['business', 'seller'] else 'personal'
            business_name = form.cleaned_data.get('business_name') or request.data.get('businessName') or ''

            try:
                with transaction.atomic():

                   

                    # âœ… Step 1: Save in DB
                    customer = Customer.objects.create_user(
                        username=username,
                        email=email,
                        name=name,
                        password=password,
                        first_name=first_name,
                        last_name=last_name,
                        phoneno=phoneno,
                        account_type=account_type,
                        business_name=business_name
                    )
                    customer.is_verified = False
                    customer.save()
                    # Step 2: Create user in Keycloak and store its ID.
                    customer.keycloak_user_id = create_keycloak_user(
                        username=username,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        password=password,
                    )
                    customer.save(update_fields=["keycloak_user_id"])

                

                    return Response(
                        {
                            "msg": "User registered successfully",
                            "userType": customer.account_type,
                            "user": serialize_auth_user(customer),
                        },
                        status=status.HTTP_201_CREATED
                    )

            except Exception as e:
                print("ðŸ”¥ ERROR OCCURRED:", str(e))

                return Response(
                    {"msg": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        

        return Response({"msg": form.errors}, status=status.HTTP_400_BAD_REQUEST)


class RegisterCustomer(APIView):
    def post(self, request):
        logger.info("Registration request received")

        email = str(request.data.get("email") or request.data.get("username") or "").strip().lower()
        if email and Customer.objects.filter(email__iexact=email).exists():
            return Response({"email": ["Email already exists"]}, status=status.HTTP_409_CONFLICT)

        mobile = str(
            request.data.get("mobile")
            or request.data.get("phone")
            or request.data.get("phoneno")
            or ""
        )
        normalized_mobile = re.sub(r"[\s()-]", "", mobile)
        if normalized_mobile:
            mobile_candidates = {normalized_mobile}
            if not normalized_mobile.startswith("+"):
                mobile_candidates.add(f"+{normalized_mobile}")
            if Customer.objects.filter(phoneno__in=mobile_candidates).exists():
                return Response({"mobile": ["Mobile already exists"]}, status=status.HTTP_409_CONFLICT)

        logger.debug("=" * 60)
        logger.debug("REGISTRATION REQUEST PAYLOAD: %s", {k: v for k, v in request.data.items() if k != "password"})
        logger.debug("=" * 60)

        serializer = RegisterCustomerSerializer(data=request.data)
        if not serializer.is_valid():
            logger.info("Registration validation failed errors=%s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        keycloak_user_id = None
        customer = None
        try:
            full_name = serializer.validated_data["full_name"].strip()
            name_parts = full_name.split(maxsplit=1)
            first_name = name_parts[0] if name_parts else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            role_name = "seller" if serializer.validated_data["account_type"] == "business" else "customer"

            logger.debug("Creating Keycloak user with email=%s first_name=%s last_name=%s role=%s",
                         serializer.validated_data["email"], first_name, last_name, role_name)
            keycloak_user_id = create_keycloak_user(
                username=serializer.validated_data["email"],
                email=serializer.validated_data["email"],
                first_name=first_name,
                last_name=last_name,
                password=serializer.validated_data["password"],
                account_type=role_name,
                business_name=serializer.validated_data.get("business_name", ""),
            )
            assign_keycloak_role(keycloak_user_id, role_name)

            with transaction.atomic():
                logger.debug("Entering transaction.atomic() - about to call serializer.save() (Customer.objects.create_user)")
                customer = serializer.save()
                logger.debug("Customer.objects.create_user() completed - customer.id=%s email=%s", customer.id, customer.email)
                customer.is_verified = False
                customer.email_verified = False
                customer.phone_verified = False
                customer.user_status = Customer.STATUS_PENDING_VERIFICATION
                customer.keycloak_user_id = keycloak_user_id
                customer.save(update_fields=["is_verified", "email_verified", "phone_verified", "user_status", "keycloak_user_id"])
                logger.info("REGISTERED user_id=%s email=%s keycloak_user_id=%s", customer.id, customer.email, keycloak_user_id)
                logger.debug("Customer.save() completed - keycloak_user_id set to: %s", customer.keycloak_user_id)

                if customer.account_type == "business":
                    SellerProfile.objects.create(
                        user=customer,
                        business_name=serializer.validated_data["business_name"],
                        business_registration_number=serializer.validated_data["business_registration_number"],
                        business_email=customer.email,
                        business_phone=str(customer.phoneno or ""),
                        business_address=serializer.validated_data["business_address"],
                        tax_id=serializer.validated_data.get("tax_id", ""),
                    )

                create_auth_audit_log(request, AuthAuditLog.ACTION_REGISTER, customer)
                logger.debug("Transaction commit complete - customer saved with keycloak_user_id=%s", customer.keycloak_user_id)
                logger.info("Registration completed user_id=%s keycloak_user_id=%s role=%s", customer.id, keycloak_user_id, role_name)

        except Exception as e:
            logger.exception("Registration failed")
            if keycloak_user_id:
                try:
                    delete_keycloak_user(keycloak_user_id)
                except Exception:
                    logger.exception("Keycloak cleanup failed keycloak_user_id=%s", keycloak_user_id)
            return Response(
                {"non_field_errors": [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "userId": customer.id,
                "status": Customer.STATUS_PENDING_VERIFICATION,
            },
            status=status.HTTP_201_CREATED
        )
def _sync_keycloak_verification(user):
    return sync_keycloak_verification(user)

class VerificationStatus(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get("email", "").strip().lower()
        if email:
            user = Customer.objects.filter(email__iexact=email).first()
        elif request.user and request.user.is_authenticated:
            user = request.user
            email = user.email
        else:
            return Response({"email": ["Email is required"]}, status=status.HTTP_400_BAD_REQUEST)

        if not user:
            return Response({"email": ["User not found"]}, status=status.HTTP_404_NOT_FOUND)

        if user.keycloak_user_id:
            try:
                kc_status = get_keycloak_user_status(user.keycloak_user_id)
                if kc_status:
                    if kc_status.get('emailVerified') and (not user.is_verified or not user.email_verified):
                        _sync_keycloak_verification(user)
                        user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "verification_timestamp", "user_status"])
                        logger.info("EMAIL_VERIFIED_IN_KEYCLOAK user_id=%s email=%s keycloak_user_id=%s", user.id, user.email, user.keycloak_user_id)
                    verified = bool(user.email_verified or user.is_verified)
                    return Response({
                        "verified": verified,
                        "emailVerified": verified,
                        "enabled": kc_status['enabled'],
                        "requiredActions": kc_status['requiredActions'],
                        "status": user.user_status,
                        "local_is_verified": user.is_verified,
                        "local_email_verified": user.email_verified,
                        "verification_timestamp": user.verification_timestamp,
                        "local_user_status": user.user_status,
                    })
            except Exception as e:
                print("Keycloak status check failed:", str(e))

        return Response({
            "verified": bool(user.email_verified or user.is_verified),
            "emailVerified": False,
            "enabled": False,
            "requiredActions": [],
            "status": "pending_verification",
            "local_is_verified": user.is_verified,
            "local_email_verified": user.email_verified,
            "verification_timestamp": user.verification_timestamp,
            "local_user_status": user.user_status,
        })


class SendEmailVerificationLink(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            email = str(request.query_params.get('email') or '').strip().lower()
            if not email:
                return Response({"msg": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = Customer.objects.filter(email__iexact=email).first()
            if not user:
                return Response({"msg": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            keycloak_user_id = ensure_keycloak_account_for_user(user)
            redirect_uri = build_keycloak_verification_redirect_uri(user.email)
            verification_client_id = getattr(settings, "KEYCLOAK_VERIFICATION_CLIENT_ID", "") or None
            send_keycloak_verification_email(
                keycloak_user_id,
                client_id=verification_client_id,
                redirect_uri=redirect_uri,
            )
            logger.info("EMAIL_VERIFICATION_EMAIL_SENT user_id=%s email=%s keycloak_user_id=%s", user.id, user.email, keycloak_user_id)
            logger.info("Verification email resent user_id=%s keycloak_user_id=%s", user.id, keycloak_user_id)
            return Response({"msg": "Verification email sent"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Verification email resend failed")
            return Response({"msg": str(e)}, status=status.HTTP_400_BAD_REQUEST)
class GenerateOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({"detail": "OTP verification is disabled. Email verification is handled by Keycloak."}, status=status.HTTP_410_GONE)


class ResendOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({"detail": "OTP verification is disabled. Email verification is handled by Keycloak."}, status=status.HTTP_410_GONE)


class VerifyOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({"detail": "OTP verification is disabled. Email verification is handled by Keycloak."}, status=status.HTTP_410_GONE)


    
class CustomerLogin(APIView):
    def post(self, request):
        form = CustomerLoginForm(request.data)

        if(form.is_valid()):
            username = form.cleaned_data['username']        
            password = form.cleaned_data['password']

            # if(not Customer.objects.filter(username=username).exists()):
            #     return Response({"msg" : "User not found"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user = authenticate(username=username, password=password)
            if(not user):
                attempted_user = Customer.objects.filter(username=username).first()
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, attempted_user)
                return Response({"msg" : "Incorrect username or password "}, status=status.HTTP_401_UNAUTHORIZED)

            _sync_keycloak_verification(user)
            user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "user_status", "verification_timestamp"])

            if user.user_status == Customer.STATUS_SUSPENDED:
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg": "Account suspended"}, status=status.HTTP_401_UNAUTHORIZED)
            if user.user_status == Customer.STATUS_DELETED:
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg": "Account deleted"}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user=user)
            access_token = str(refresh.access_token)
            payload = {
                "msg" : "Authenticated",
                "token": access_token,
                "access": access_token,
                "refresh": str(refresh),
                "userType": getattr(user, "account_type", "personal"),
                "user": serialize_auth_user(user),
            }
            payload.update(auth_verification_payload(user))
            response = Response(payload, status=status.HTTP_200_OK)
            response['Authorization'] = f'Bearer {access_token}'
            create_auth_audit_log(request, AuthAuditLog.ACTION_LOGIN, user)

            return response
        
        return Response({"msg" : form.errors}, status=status.HTTP_400_BAD_REQUEST)
    
class ResetPasswordRoute(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]  # Require authentication for POST
        return [AllowAny()]  # Allow any user for GET requests
    
    def get(self, request):
        # form = PasswordResetForm(request.data)

        # if(form.is_valid()):
            
        email = request.query_params.get('email')
        try:
            customer = Customer.objects.get(email=email)
            refresh = RefreshToken.for_user(customer)
            access_token = str(refresh.access_token)
            reset_url = self.build_reset_url(request, access_token)

            send_mail(
                'Password Reset Link',
                f'Click here to change the password: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email]  # assuming username is email
            )

            return Response({"msg" : "Verification link sent to email"}, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"msg" : f"Internal server error {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # return Response({"msg" : "Form not valid", "err" : form.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def post(self, request):
        form = NewPasswordResetForm(request.data)
        if(form.is_valid()):
            password = form.cleaned_data['password']
            try:
                auth_header = request.headers.get("Authorization")
                token = auth_header.split(" ")[1]
                access_token = AccessToken(token)
                user_id = access_token['user_id']

                customer = Customer.objects.get(id=user_id)
                # print(customer)
                customer.set_password(password)
                customer.save()

                return Response({"msg" : "Password changed"}, status=status.HTTP_200_OK)
            
            except Exception as e:
                return Response({"msg" : f"Internal server error {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"msg" : "Form not valid", "err" : form.errors}, status=status.HTTP_400_BAD_REQUEST)


    
    def build_reset_url(self, request, token):
        # domain = get_current_site(request).domain
        frontend_url = f"http://localhost:5173/forgotPassword/?token={token}"
        return frontend_url
        
       
class CustomerAddressRoute(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        CustAddresses = user.addresses.all()

        CustAddressSerializer = CustomerAddressSerializer(CustAddresses, many=True)

        return Response(CustAddressSerializer.data, status=status.HTTP_200_OK)
    
    def put(self, request): #for editing address
        user = request.user
        form = CustomerAddressEditForm(request.data)
        
        if(form.is_valid()):
            id = form.cleaned_data['id']
            label = form.cleaned_data['label']
            address1 = form.cleaned_data['address1']
            address2 = form.cleaned_data['address2']
            state = form.cleaned_data['state']
            city = form.cleaned_data['city']
            country = form.cleaned_data['country']
            zipCode = form.cleaned_data['zipCode']

            custAddress = user.addresses.get(id=id)
            custAddress.label = label
            custAddress.address1 = address1
            custAddress.address2 = address2
            custAddress.state = state
            custAddress.city = city
            custAddress.country = country
            custAddress.zipCode = zipCode

            custAddress.save()
            return Response({"msg" : "updated"}, status=status.HTTP_200_OK)
        
        return Response({"msg" : form.errors}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request): #for inserting address
        user = request.user
        form = CustomerAddressCreateForm(request.data)

        if(form.is_valid()):
            label = form.cleaned_data['label']
            address1 = form.cleaned_data['address1']
            address2 = form.cleaned_data['address2']
            state = form.cleaned_data['state']
            city = form.cleaned_data['city']
            country = form.cleaned_data['country']
            zipCode = form.cleaned_data['zipCode']

            custAddress = CustomerAddress.objects.create(
                custId = user,
                label = label,
                address1 = address1,
                address2 = address2,
                state = state,
                city = city,
                country = country,
                zipCode = zipCode
            )

            custAddressSerialized = CustomerAddressSerializer(custAddress)

            return Response({"msg" : "Success", "newAddress": custAddressSerialized.data}, status=status.HTTP_201_CREATED)
        
        return Response({"msg" : form.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        user = request.user

        # form = CustomerAddressDeleteForm(request.data)

        # if(form.is_valid()):
            # id = form.cleaned_data['id']
        id = request.query_params.get('id')
        try:
            address = user.addresses.get(id=id)
            address.delete()
            return Response({"msg" : "Success"}, status=status.HTTP_200_OK)
        except:
            return Response({"msg" : "Address ID not found"}, status=status.HTTP_400_BAD_REQUEST)


        
    

#for reading/updating name and phoneno
class CustomerUpdateProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        nameAndPhoneJson = CustomerNamePhoneSerializer(user)
        return Response(nameAndPhoneJson.data, status=status.HTTP_200_OK)
    
    def put(self, request): #update the details
        form = CustomerUpdateProfileForm(request.data)

        if(form.is_valid()):
            user = request.user
            name = form.cleaned_data['name']
            phoneno = form.cleaned_data['phoneno']
            
            customer = Customer.objects.get(username=user)
            customer.name = name
            customer.phoneno = phoneno
            try:
                customer.save()
            except:
                return Response({"msg" : "Unable to update profile. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                "msg" : "Profile updated successfully",
                "updatedData" : {
                        "name" : name, 
                        "phoneno" : str(phoneno)
                    }
                },
                status=status.HTTP_200_OK
            )
        
        return Response({"msg" : str(form.errors.as_data())}, status=status.HTTP_400_BAD_REQUEST)
    
class SubscriberRoute(APIView):

    def post(self, request):
        form = SubscriberForm(request.data)

        if(form.is_valid()):
            email = form.cleaned_data['email']

            try:
                Subscriber.objects.create(
                    email = email
                )
                return Response({"msg" : "Email registered"}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"msg" : f"error occured{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({"msg" : form.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        

#final view for returining all the address and phone nos
class CustomerProfile(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        _sync_keycloak_verification(user)
        user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "user_status", "verification_timestamp"])

        userProfile = CustomerUpdateProfile().get(request)
        addresses = CustomerAddressRoute().get(request)

        return Response({ 
            "profileData" : {
                "profile" : userProfile.data,
                "savedAddresses" : addresses.data
                }
            },
            status=status.HTTP_200_OK
        )
        



# for testing
class ProtectedRoute(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"msg" : "Ths is protected route"}, status=status.HTTP_200_OK)


class GoogleLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"msg": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        account_type = request.data.get("accountType") or request.data.get("userType") or "personal"
        account_type = "business" if str(account_type).lower() in ["business", "seller"] else "personal"
        first_name = request.data.get("firstName") or ""
        last_name = request.data.get("lastName") or ""

        user, created = Customer.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": last_name,
                "name": f"{first_name} {last_name}".strip() or email,
                "account_type": account_type,
                "is_verified": False,
                "user_status": Customer.STATUS_PENDING_VERIFICATION,
            },
        )

        if created:
            temp_password = secrets.token_urlsafe(32)
            user.set_unusable_password()
            user.save()
            keycloak_user_id = None
            try:
                with transaction.atomic():
                    if account_type == "business":
                        SellerProfile.objects.create(
                            user=user,
                            business_name=request.data.get("businessName", ""),
                            business_registration_number=request.data.get("businessRegistrationNumber", ""),
                            business_email=email,
                            business_phone="",
                            business_address=request.data.get("businessAddress", ""),
                            tax_id=request.data.get("taxId", ""),
                        )
                    keycloak_user_id = ensure_keycloak_account_for_user(user, password=temp_password)
                    create_auth_audit_log(request, AuthAuditLog.ACTION_REGISTER, user)
                    logger.info("Google account created pending Keycloak verification user_id=%s keycloak_user_id=%s", user.id, keycloak_user_id)
            except Exception as e:
                logger.exception("Google account Keycloak setup failed")
                if keycloak_user_id:
                    try:
                        delete_keycloak_user(keycloak_user_id)
                    except Exception:
                        logger.exception("Google account Keycloak cleanup failed keycloak_user_id=%s", keycloak_user_id)
                if user.pk:
                    user.delete()
                return Response({"msg": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                "msg": "Account created. Please verify your email.",
                "requires_verification": True,
                "email": user.email
            }, status=status.HTTP_201_CREATED)

        _sync_keycloak_verification(user)
        user.refresh_from_db(fields=["is_verified", "email_verified", "phone_verified", "user_status", "verification_timestamp"])
        if user.user_status == Customer.STATUS_SUSPENDED:
            return Response({"msg": "Account suspended"}, status=status.HTTP_401_UNAUTHORIZED)
        if user.user_status == Customer.STATUS_DELETED:
            return Response({"msg": "Account deleted"}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user=user)
        access_token = str(refresh.access_token)
        payload = {
            "token": access_token,
            "access": access_token,
            "refresh": str(refresh),
            "userType": getattr(user, "account_type", "personal"),
            "user": serialize_auth_user(user),
        }
        payload.update(auth_verification_payload(user))
        return Response(payload, status=status.HTTP_200_OK)
# class CustomerPhoneNoRoute(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         # print("hi")
#         user = request.user

#         phonenos = user.phonenos.all()
#         phoneSerializer = CustomerPhoneSerializer(phonenos, many=True)

#         return Response(phoneSerializer.data, status=status.HTTP_200_OK)
    
#     def put(self, request):
#         user = request.user
#         form = CustomerPhoneForm(request.data)
        
#         if(form.is_valid()):
#             id = form.cleaned_data['id']
#             phoneno = form.cleaned_data['phoneno']

#             custphonenos = user.phonenos.get(id=id)
#             custphonenos.phoneno = phoneno
#             custphonenos.save()

#             return Response({"msg" : "updated"}, status=status.HTTP_200_OK)
        
#         return Response({"msg" : "Invalid form"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     def post(self, request):
#         user = request.user
#         form = CustomerPhoneCreateForm(request.data)

#         if(form.is_valid()):
#             phoneno = form.cleaned_data['phoneno']

#             CustomerPhoneNo.objects.create(
#                 custId = user,
#                 phoneno = phoneno
#             )

#             return Response({"msg" : "Success"}, status=status.HTTP_201_CREATED)
        
#         return Response({"msg" : "Form not valid"}, status=status.HTTP_400_BAD_REQUEST)
    
#     def delete(self, request):
#         user = request.user

#         form = CustomerPhoneDeleteForm(request.data)

#         if(form.is_valid()):
#             id = form.cleaned_data['id']

#             phoneno = user.phonenos.get(id=id)
#             phoneno.delete()

#             return Response({"msg" : "Success"}, status=status.HTTP_200_OK)
        
#         return Response({"msg" : "Form not valid"}, status=status.HTTP_400_BAD_REQUEST)









