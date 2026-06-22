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
# email verification imports removed — Keycloak handles email verification
from .keycloak import (
    create_keycloak_user,
    delete_keycloak_user,
    send_keycloak_verification_email,
    check_keycloak_email_verified,
    update_keycloak_email_verified,
    get_keycloak_user_status,
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


def serialize_auth_user(user):
    if user.keycloak_user_id:
        _sync_keycloak_verification(user)
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
    send_mail(
        "Your verification OTP",
        f"Your verification OTP is {otp_record.otp}. It expires in 10 minutes.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )


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


class CustomerTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username")
        try:
            user = Customer.objects.get(username=username)
        except Customer.DoesNotExist:
            raise AuthenticationFailed("Incorrect username or password")
        _sync_keycloak_verification(user)
        if not user.is_verified:
            raise AuthenticationFailed("Verify your email first")
        if user.user_status == Customer.STATUS_PENDING_OTP:
            raise AuthenticationFailed("Complete OTP verification")
        if user.user_status == Customer.STATUS_SUSPENDED:
            raise AuthenticationFailed("Account suspended")
        data = super().validate(attrs)
        data["token"] = data["access"]
        data["userType"] = getattr(self.user, "account_type", "personal")
        data["user"] = serialize_auth_user(self.user)
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
        print("REQUEST DATA:", request.data)

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

        serializer = RegisterCustomerSerializer(data=request.data)
        if not serializer.is_valid():
            print("SERIALIZER ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        keycloak_user_id = None
        try:
            with transaction.atomic():
                customer = serializer.save()
                customer.is_verified = False
                customer.user_status = Customer.STATUS_PENDING_VERIFICATION
                customer.save()

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
                keycloak_user_id = create_keycloak_user(
                    username=customer.username,
                    email=customer.email,
                    first_name=customer.first_name,
                    last_name=customer.last_name,
                    password=serializer.validated_data["password"],
                )
                customer.keycloak_user_id = keycloak_user_id
                customer.save(update_fields=["keycloak_user_id"])
                create_auth_audit_log(request, AuthAuditLog.ACTION_REGISTER, customer)

        except Exception as e:
            print("REGISTRATION ERROR:", str(e))
            if keycloak_user_id:
                try:
                    delete_keycloak_user(keycloak_user_id)
                except Exception as kc_err:
                    print("KEYCLOAK CLEANUP FAILED:", str(kc_err))
            return Response(
                {"non_field_errors": [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trigger Keycloak verification email — non-fatal
        try:
            from django.conf import settings
            frontend_url = getattr(settings, 'SITE_URL', 'http://localhost:5173')
            redirect_uri = f"{frontend_url}/verify-account?email={customer.email}"
            send_keycloak_verification_email(customer.keycloak_user_id, redirect_uri=redirect_uri)
            email_msg = "Verification email sent"
        except Exception as e:
            print("KEYCLOAK VERIFICATION EMAIL FAILED (non-fatal):", str(e))
            email_msg = "Verification email could not be sent — use resend option"

        return Response(
            {
                "userId": customer.id,
                "status": customer.user_status,
                "message": email_msg,
            },
            status=status.HTTP_201_CREATED
        )
    
def _sync_keycloak_verification(user):
    if not user.keycloak_user_id:
        return
    try:
        status = get_keycloak_user_status(user.keycloak_user_id)
        if status and status.get('emailVerified') and not user.is_verified:
            user.is_verified = True
            if user.user_status == Customer.STATUS_PENDING_VERIFICATION:
                user.user_status = Customer.STATUS_PENDING_OTP
            user.save(update_fields=["is_verified", "user_status"])
    except Exception as e:
        print("Keycloak sync failed (non-fatal):", str(e))


class VerificationStatus(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get("email", "").strip().lower()
        if not email:
            return Response({"email": ["Email is required"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Customer.objects.get(email__iexact=email)
        except Customer.DoesNotExist:
            return Response({"email": ["User not found"]}, status=status.HTTP_404_NOT_FOUND)

        if user.keycloak_user_id:
            try:
                kc_status = get_keycloak_user_status(user.keycloak_user_id)
                if kc_status:
                    if kc_status.get('emailVerified') and not user.is_verified:
                        _sync_keycloak_verification(user)
                    return Response({
                        "emailVerified": kc_status['emailVerified'],
                        "enabled": kc_status['enabled'],
                        "requiredActions": kc_status['requiredActions'],
                        "status": "verified" if kc_status['emailVerified'] else "pending_verification",
                        "local_is_verified": user.is_verified,
                        "local_user_status": user.user_status,
                    })
            except Exception as e:
                print("Keycloak status check failed:", str(e))

        return Response({
            "emailVerified": False,
            "enabled": False,
            "requiredActions": [],
            "status": "pending_verification",
            "local_is_verified": user.is_verified,
            "local_user_status": user.user_status,
        })


class SendEmailVerificationLink(APIView):
    def get(self, request):
        try:
            email = request.query_params.get('email')
            if not email:
                return Response({"msg": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = Customer.objects.filter(email__iexact=email).first()
            if not user or not user.keycloak_user_id:
                return Response({"msg": "User not found or no Keycloak account"}, status=status.HTTP_404_NOT_FOUND)

            from django.conf import settings
            frontend_url = getattr(settings, 'SITE_URL', 'http://localhost:5173')
            redirect_uri = f"{frontend_url}/verify-account?email={email}"
            send_keycloak_verification_email(user.keycloak_user_id, redirect_uri=redirect_uri)
            return Response({"msg": "Verification email sent"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"msg": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GenerateOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"email": ["Email is required"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Customer.objects.get(email__iexact=email)
        except Customer.DoesNotExist:
            return Response({"email": ["User not found"]}, status=status.HTTP_404_NOT_FOUND)

        _sync_keycloak_verification(user)

        if not user.is_verified:
            return Response({"detail": "Verify email before generating OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = create_otp_for_user(user)
        try:
            send_otp_email(user, otp_record)
        except Exception as e:
            print("OTP EMAIL SEND FAILED (non-fatal):", str(e))
        return Response({"message": "OTP sent", "expiresAt": otp_record.expires_at}, status=status.HTTP_201_CREATED)


class ResendOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"email": ["Email is required"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Customer.objects.get(email__iexact=email)
        except Customer.DoesNotExist:
            return Response({"email": ["User not found"]}, status=status.HTTP_404_NOT_FOUND)

        _sync_keycloak_verification(user)

        if not user.is_verified:
            return Response({"detail": "Verify email before resending OTP."}, status=status.HTTP_400_BAD_REQUEST)

        window_start = timezone.now() - timedelta(minutes=10)
        latest = user.otp_verifications.filter(created_at__gte=window_start).first()
        attempts = latest.attempts if latest else 0
        if attempts >= 3:
            return Response({"detail": "Maximum OTP resend attempts reached. Try again later."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        otp_record = create_otp_for_user(user, attempts=attempts + 1)
        try:
            send_otp_email(user, otp_record)
        except Exception as e:
            print("OTP EMAIL SEND FAILED (non-fatal):", str(e))
        return Response({"message": "OTP resent", "expiresAt": otp_record.expires_at}, status=status.HTTP_200_OK)


class VerifyOTP(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        otp = str(request.data.get("otp") or "").strip()
        if not email:
            return Response({"email": ["Email is required"]}, status=status.HTTP_400_BAD_REQUEST)
        if not re.fullmatch(r"\d{6}", otp):
            return Response({"otp": ["Enter a valid 6 digit OTP"]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Customer.objects.get(email__iexact=email)
        except Customer.DoesNotExist:
            return Response({"email": ["User not found"]}, status=status.HTTP_404_NOT_FOUND)

        _sync_keycloak_verification(user)

        if not user.is_verified:
            return Response({"detail": "Verify email before verifying OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = user.otp_verifications.filter(verified=False).first()
        if not otp_record:
            return Response({"detail": "No active OTP found."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.is_expired():
            return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.otp != otp:
            return Response({"otp": ["Invalid OTP"]}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.verified = True
        otp_record.save(update_fields=["verified"])
        user.user_status = Customer.STATUS_ACTIVE
        user.save(update_fields=["user_status"])
        if user.keycloak_user_id:
            try:
                update_keycloak_email_verified(user.keycloak_user_id, verified=True)
            except Exception as e:
                print("Keycloak status sync failed (non-fatal):", str(e))
        create_auth_audit_log(request, AuthAuditLog.ACTION_OTP_VERIFICATION, user)
        return Response({"message": "OTP verified", "status": user.user_status}, status=status.HTTP_200_OK)


    
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

            if not user.is_verified:
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg": "Verify your email first"}, status=status.HTTP_401_UNAUTHORIZED)
            if user.user_status == Customer.STATUS_PENDING_OTP:
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg": "Complete OTP verification"}, status=status.HTTP_401_UNAUTHORIZED)
            if user.user_status == Customer.STATUS_SUSPENDED:
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg": "Account suspended"}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user=user)
            access_token = str(refresh.access_token)
            response = Response({
                "msg" : "Authenticated",
                "token": access_token,
                "access": access_token,
                "refresh": str(refresh),
                "userType": getattr(user, "account_type", "personal"),
                "user": serialize_auth_user(user),
            }, status=status.HTTP_200_OK)
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
        email = request.data.get("email")
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
            import secrets
            temp_password = secrets.token_urlsafe(32)
            user.set_unusable_password()
            user.save()
            keycloak_user_id = None
            try:
                with transaction.atomic():
                    keycloak_user_id = create_keycloak_user(
                        username=email,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        password=temp_password,
                    )
                    user.keycloak_user_id = keycloak_user_id
                    user.save(update_fields=["keycloak_user_id"])
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
            except Exception as e:
                if keycloak_user_id:
                    try:
                        delete_keycloak_user(keycloak_user_id)
                    except Exception:
                        pass
                if user.pk:
                    user.delete()
                return Response(
                    {"msg": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                from django.conf import settings
                frontend_url = getattr(settings, 'SITE_URL', 'http://localhost:5173')
                redirect_uri = f"{frontend_url}/verify-account?email={user.email}"
                send_keycloak_verification_email(user.keycloak_user_id, redirect_uri=redirect_uri)
            except Exception as e:
                print("KEYCLOAK VERIFICATION EMAIL FAILED (non-fatal):", str(e))
            create_auth_audit_log(request, AuthAuditLog.ACTION_REGISTER, user)
            return Response({
                "msg": "Account created. Please verify your email.",
                "requires_verification": True,
                "email": user.email
            }, status=status.HTTP_201_CREATED)

        if not user.is_verified:
            return Response({
                "msg": "Verify your email first",
                "requires_verification": True,
                "email": user.email
            }, status=status.HTTP_401_UNAUTHORIZED)
        if user.user_status == Customer.STATUS_PENDING_OTP:
            return Response({
                "msg": "Complete OTP verification",
                "requires_verification": True,
                "email": user.email
            }, status=status.HTTP_401_UNAUTHORIZED)
        if user.user_status == Customer.STATUS_SUSPENDED:
            return Response({
                "msg": "Account suspended",
            }, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user=user)
        access_token = str(refresh.access_token)
        return Response({
            "token": access_token,
            "access": access_token,
            "refresh": str(refresh),
            "userType": getattr(user, "account_type", "personal"),
            "user": serialize_auth_user(user),
        }, status=status.HTTP_200_OK)
    
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



