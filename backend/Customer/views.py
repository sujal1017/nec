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
from django.urls import reverse
from django.conf import settings
from .utils import generate_email_token, verify_email_token
import asyncio #for sending email asynchronously
import requests
import re
import random
from datetime import timedelta

from django.http import HttpResponse
from .html_pages import email_verified_successfully_page

from django.core.validators import validate_email


# Create your vi
import requests
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


def serialize_auth_user(user):
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
        data = super().validate(attrs)
        if not self.user.is_verified or getattr(self.user, "user_status", "") != Customer.STATUS_ACTIVE:
            raise AuthenticationFailed("Please verify your email before logging in.")
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

            # ✅ uniqueness checks
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

                   

                    # ✅ Step 1: Save in DB
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

                 

                    # ✅ Step 2: Get Keycloak token
                    token_url = "https://iam.astropean.com/realms/master/protocol/openid-connect/token"

                    token_data = {
                        "grant_type": "password",
                        "client_id": "admin-cli",
                        "username": "kcadmin",
                        "password": "NEC2025$12!"
                    }


                    token_response = requests.post(token_url, data=token_data)


                    if token_response.status_code != 200:
                        raise Exception(f"Token Error: {token_response.text}")

                    access_token = token_response.json().get("access_token")

                    if not access_token:
                        raise Exception("No access token received")

               

                    # ✅ Step 3: Create user in Keycloak
                    kc_user_url = "https://iam.astropean.com/admin/realms/Buy-Sell/users"

                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }

                    kc_payload = {
                        "username": username,
                        "email": email,
                        "firstName": first_name,
                        "lastName": last_name,
                        "enabled": True,
                        "emailVerified": True,
                        "credentials": [{
                            "type": "password",
                            "value": password,
                            "temporary": False
                        }]
                    }

                   

                    kc_response = requests.post(
                        kc_user_url,
                        json=kc_payload,
                        headers=headers
                    )



                    # ✅ Step 4: Check Keycloak response
                    if kc_response.status_code != 201:
                        raise Exception(f"Keycloak Error: {kc_response.text}")

                

                    return Response(
                        {
                            "msg": "User registered successfully",
                            "userType": customer.account_type,
                            "user": serialize_auth_user(customer),
                        },
                        status=status.HTTP_201_CREATED
                    )

            except Exception as e:
                print("🔥 ERROR OCCURRED:", str(e))

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
                        tax_id=serializer.validated_data["tax_id"],
                    )

                # Existing Keycloak integration remains part of the registration flow.
                token_url = "https://iam.astropean.com/realms/master/protocol/openid-connect/token"
                token_data = {
                    "grant_type": "password",
                    "client_id": "admin-cli",
                    "username": "kcadmin",
                    "password": "NEC2025$12!"
                }

                token_response = requests.post(token_url, data=token_data)
                if token_response.status_code != 200:
                    raise Exception(f"Token Error: {token_response.text}")

                access_token = token_response.json().get("access_token")
                if not access_token:
                    raise Exception("No access token received")

                kc_user_url = "https://iam.astropean.com/admin/realms/Buy-Sell/users"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                kc_payload = {
                    "username": customer.username,
                    "email": customer.email,
                    "firstName": customer.first_name,
                    "lastName": customer.last_name,
                    "enabled": True,
                    "emailVerified": True,
                    "credentials": [{
                        "type": "password",
                        "value": serializer.validated_data["password"],
                        "temporary": False
                    }]
                }

                kc_response = requests.post(
                    kc_user_url,
                    json=kc_payload,
                    headers=headers
                )

                if kc_response.status_code != 201:
                    raise Exception(f"Keycloak Error: {kc_response.text}")

                VerifyEmail.send_verification_email(request, customer.email)
                create_auth_audit_log(request, AuthAuditLog.ACTION_REGISTER, customer)

                return Response(
                    {
                        "userId": customer.id,
                        "status": customer.user_status,
                        "message": "Verification email sent",
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            print("REGISTRATION ERROR:", str(e))
            return Response(
                {"non_field_errors": [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
#for email verification
class VerifyEmail(APIView):
    @staticmethod
    def build_verification_link(request, username):
        token = generate_email_token(username)
        return request.build_absolute_uri(
            reverse('verify_email') + f'?token={token}'
        )

    @staticmethod
    def send_verification_email(request, username):
        verification_link = VerifyEmail.build_verification_link(request, username)

        send_mail(
            'Verify your email',
            f'Click here to verify: {verification_link}',
            settings.DEFAULT_FROM_EMAIL,
            [username]  # assuming username is email
        )

    @staticmethod
    async def generateLink(request, username):
        return VerifyEmail.send_verification_email(request, username)

    def get(self, request):
        token = request.GET.get('token')
        email = verify_email_token(token)
    
        if(not email):
            # return Response({"msg" : "Link expired or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
            return HttpResponse(email_verified_successfully_page(msg = "Email Verification failed", success=False))
        
        try:
            user = Customer.objects.get(username=email)
            user.is_verified = True
            user.user_status = Customer.STATUS_PENDING_OTP
            user.save()
            otp_record = create_otp_for_user(user)
            send_otp_email(user, otp_record)
            create_auth_audit_log(request, AuthAuditLog.ACTION_EMAIL_VERIFICATION, user)
            # return Response({"msg": "Email verified successfully"}, status=status.HTTP_200_OK)
            return HttpResponse(email_verified_successfully_page(msg = "Email verified Successfully. OTP sent.", success=True))
        except:
            # return Response({"msg" : "User doesn't exist"}, status=status.HTTP_401_UNAUTHORIZED)
            return HttpResponse(email_verified_successfully_page(msg = "Email Verification failed", success=False))

        

class SendEmailVerificationLink(APIView):
    def get(self, request):
        try:
            email = request.query_params.get('email')

            if(not self.isValidEmail(email)):
                return Response({"msg" : "Invalid email format"}, status=status.HTTP_400_BAD_REQUEST)

            VerifyEmail.send_verification_email(request, email)
            return Response({"msg" : "email sent"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"msg" : "email not sent"}, status=status.HTTP_400_BAD_REQUEST)
    

    def isValidEmail(self, email):
        try:
            validate_email(email)
            return True
        except:
            return False


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

        if not user.is_verified:
            return Response({"detail": "Verify email before generating OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = create_otp_for_user(user)
        send_otp_email(user, otp_record)
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

        if not user.is_verified:
            return Response({"detail": "Verify email before resending OTP."}, status=status.HTTP_400_BAD_REQUEST)

        window_start = timezone.now() - timedelta(minutes=10)
        latest = user.otp_verifications.filter(created_at__gte=window_start).first()
        attempts = latest.attempts if latest else 0
        if attempts >= 3:
            return Response({"detail": "Maximum OTP resend attempts reached. Try again later."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        otp_record = create_otp_for_user(user, attempts=attempts + 1)
        send_otp_email(user, otp_record)
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
            
            #checking whether email is verified or not
            if(user.is_verified == False or getattr(user, "user_status", "") != Customer.STATUS_ACTIVE):
                create_auth_audit_log(request, AuthAuditLog.ACTION_FAILED_LOGIN, user)
                return Response({"msg" : "Please Verify the Email"}, status=status.HTTP_401_UNAUTHORIZED)

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
                "is_verified": True,
                "user_status": Customer.STATUS_ACTIVE,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()

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
