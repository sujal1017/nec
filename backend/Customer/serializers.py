import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Customer
from .models import CustomerAddress
# from .models import CustomerPhoneNo


def normalize_account_type(value):
    account_type = str(value or "personal").strip().lower()
    if account_type in ["business", "seller"]:
        return "business"
    return "personal"


class RegisterCustomerSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True, trim_whitespace=True)
    email = serializers.EmailField(required=True)
    mobile = serializers.CharField(required=True, trim_whitespace=True)
    password = serializers.CharField(required=True, write_only=True)
    account_type = serializers.ChoiceField(
        choices=["personal", "business"],
        required=False,
        default="personal",
    )
    business_name = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    business_registration_number = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    tax_id = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    business_address = serializers.CharField(
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    def to_internal_value(self, data):
        mutable = dict(data)

        first_name = mutable.get("firstName") or mutable.get("first_name") or ""
        last_name = mutable.get("lastName") or mutable.get("last_name") or ""
        if not mutable.get("full_name"):
            mutable["full_name"] = f"{first_name} {last_name}".strip() or mutable.get("name", "")

        if not mutable.get("mobile"):
            mutable["mobile"] = mutable.get("phone") or mutable.get("phoneno") or mutable.get("mobile", "")

        if not mutable.get("account_type"):
            mutable["account_type"] = mutable.get("userType") or mutable.get("accountType") or "personal"
        mutable["account_type"] = normalize_account_type(mutable.get("account_type"))

        if not mutable.get("business_name"):
            mutable["business_name"] = mutable.get("businessName") or ""
        if not mutable.get("business_registration_number"):
            mutable["business_registration_number"] = mutable.get("businessRegistrationNumber") or ""
        if not mutable.get("tax_id"):
            mutable["tax_id"] = mutable.get("taxId") or mutable.get("taxIdVat") or ""
        if not mutable.get("business_address"):
            mutable["business_address"] = mutable.get("businessAddress") or ""

        return super().to_internal_value(mutable)

    def validate_mobile(self, value):
        mobile = re.sub(r"[\s()-]", "", value)
        if not re.fullmatch(r"\+?\d{10,15}", mobile):
            raise serializers.ValidationError("Enter a valid mobile number.")

        candidates = {mobile}
        if not mobile.startswith("+"):
            candidates.add(f"+{mobile}")

        if Customer.objects.filter(phoneno__in=candidates).exists():
            raise serializers.ValidationError("Mobile already exists")
        return mobile

    def validate_email(self, value):
        email = value.strip().lower()
        if Customer.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already exists")
        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))

        if not re.search(r"[A-Z]", value) or not re.search(r"[a-z]", value) or not re.search(r"\d", value) or not re.search(r"[^A-Za-z0-9]", value):
            raise serializers.ValidationError("Password must include uppercase, lowercase, number, and symbol.")
        return value

    def validate(self, attrs):
        if attrs["account_type"] == "business":
            errors = {}
            if not attrs.get("business_name"):
                errors["business_name"] = ["Business name is required for business users."]
            if not attrs.get("business_registration_number"):
                errors["business_registration_number"] = ["Business registration number is required for business users."]
            if not attrs.get("tax_id"):
                errors["tax_id"] = ["Tax ID / VAT number is required for business users."]
            if not attrs.get("business_address"):
                errors["business_address"] = ["Business address is required for business users."]
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    def create(self, validated_data):
        full_name = validated_data["full_name"].strip()
        name_parts = full_name.split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        email = validated_data["email"]

        return Customer.objects.create_user(
            username=email,
            email=email,
            name=full_name,
            password=validated_data["password"],
            first_name=first_name,
            last_name=last_name,
            phoneno=validated_data["mobile"],
            account_type=validated_data["account_type"],
            business_name=validated_data.get("business_name", ""),
        )

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phoneno', 'avatar', 'account_type', 'business_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        return Customer.objects.create_user(**validated_data)

class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        # fields = ['custId', 'address']
        fields = ['id', 'label', 'address1', 'address2', 'city', 'state', 'country', 'zipCode']


#for name and phoneno
class CustomerNamePhoneSerializer(serializers.ModelSerializer):
    # phoneno = serializers.CharField(source='phoneno') 
    class Meta:
        model = Customer
        fields = ['name', 'phoneno', 'email', 'avatar', 'account_type', 'business_name']

# class CustomerPhoneSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = CustomerPhoneNo
#         # fields = ['custId', 'phoneno']
#         fields = ['id', 'phoneno']
