from django import forms
from .models import Customer
from django.core.exceptions import ValidationError

from django import forms
from .models import Customer

from .models import  CustomerAddress, Subscriber

class CustomerForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput()  # ✅ hides password in UI
    )

    class Meta:
        model = Customer
        fields = [
            'name',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phoneno',
            'account_type',
            'business_name',
        ]


class CustomerLoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField() 


# address edit
class CustomerAddressEditForm(forms.ModelForm):
    id = forms.IntegerField()
    class Meta:
        model = CustomerAddress
        fields = ['id', 'label', 'address1', 'address2', 'city', 'state', 'country', 'zipCode']

# for inserting address
class CustomerAddressCreateForm(forms.ModelForm):
    class Meta:
        model = CustomerAddress
        fields = ['label', 'address1', 'address2', 'city', 'state', 'country', 'zipCode']

#for Deleting address
class CustomerAddressDeleteForm(forms.Form):
    id = forms.IntegerField()

#phone no    
class CustomerPhoneForm(forms.Form):
    id = forms.IntegerField()  
    phoneno = forms.CharField()  

# for inserting phoneno
class CustomerPhoneCreateForm(forms.Form): 
    phoneno = forms.IntegerField()  

#for Deleting phoneno
class CustomerPhoneDeleteForm(forms.Form):
    id = forms.IntegerField()

#for updating the Customer profile - name, phoneno
class CustomerUpdateProfileForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['name', 'phoneno']

class SubscriberForm(forms.ModelForm):
    class Meta:
        model = Subscriber
        fields = ['email']

class PasswordResetForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['email']

class NewPasswordResetForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['password']
