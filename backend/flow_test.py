import os, sys, json, urllib.request, urllib.parse
sys.path.insert(0, r'C:\Users\hp\OneDrive\Desktop\E-comm_team_1\backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'EcommerceProject.settings'
import django; django.setup()
from Customer.models import Customer
from Customer.keycloak import delete_keycloak_user, get_keycloak_user_status

# Clean up leftovers
for user in Customer.objects.filter(email__startswith='flowend'):
    if user.keycloak_user_id:
        try: delete_keycloak_user(user.keycloak_user_id)
        except: pass
    user.delete()

BASE = 'http://127.0.0.1:8000'

print('=== TEST 1: REGISTER ===')
reg = {'username':'flowend@test.com','email':'flowend@test.com','mobile':'+1999888770','password':'Aa1!xpass','confirm_password':'Aa1!xpass','userType':'personal','fullName':'Flow End'}
r = urllib.request.Request(BASE+'/customer/register/', data=json.dumps(reg).encode(), headers={'Content-Type':'application/json'})
resp = urllib.request.urlopen(r, timeout=15)
d = json.loads(resp.read())
assert resp.status == 201
print('  PASS â€” userId={} message={}'.format(d['userId'], d.get('message','')))

user = Customer.objects.get(email='flowend@test.com')
print('  Django is_verified:', user.is_verified)
print('  Django user_status:', user.user_status)
assert user.is_verified == False
assert user.user_status == Customer.STATUS_PENDING_VERIFICATION

print('=== TEST 2: VERIFICATION STATUS (pending) ===')
r = urllib.request.Request(BASE+'/customer/verification-status/?email=flowend@test.com')
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert resp.get('emailVerified') == False
assert resp.get('status') == 'pending_verification'
print('  PASS â€” emailVerified={} status={}'.format(resp['emailVerified'], resp['status']))

print('=== TEST 3: LOGIN ALLOWED (email not verified) ===')
login_data = urllib.parse.urlencode({'username':'flowend@test.com','password':'Aa1!xpass'}).encode()
r = urllib.request.Request(BASE+'/customer/login/', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert 'access' in resp
assert resp.get('emailVerified') == False
assert resp.get('requiresEmailVerification') == True
assert resp.get('userStatus') == 'pending_verification'
print('  PASS - JWT received emailVerified={} requiresEmailVerification={} userStatus={}'.format(resp['emailVerified'], resp['requiresEmailVerification'], resp['userStatus']))

print('=== TEST 4: USER CLICKS VERIFY EMAIL ===')
verify_request = urllib.request.Request(BASE+'/customer/send-email-verification-link/?email=flowend@test.com')
verify_resp = json.loads(urllib.request.urlopen(verify_request, timeout=10).read())
assert verify_resp.get('msg') == 'Verification email sent'
print('  PASS - Keycloak execute-actions-email triggered')

print('=== TEST 5: SYNC Keycloak emailVerified=true manually ===')
kc_status = get_keycloak_user_status(user.keycloak_user_id)
print('  KC status before:', kc_status)
from Customer.keycloak import update_keycloak_email_verified
update_keycloak_email_verified(user.keycloak_user_id, verified=True)
kc_status = get_keycloak_user_status(user.keycloak_user_id)
assert kc_status['emailVerified'] == True
print('  PASS â€” KC emailVerified set to True')

print('=== TEST 6: VERIFICATION STATUS (now verified via polling) ===')
r = urllib.request.Request(BASE+'/customer/verification-status/?email=flowend@test.com')
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert resp.get('emailVerified') == True
assert resp.get('verified') == True
assert resp.get('status') == 'active'
print('  PASS - emailVerified={}'.format(resp['emailVerified']))

# Reload user from DB to check sync
user.refresh_from_db()
print('  Django is_verified after sync:', user.is_verified)
print('  Django user_status after sync:', user.user_status)
assert user.is_verified == True
assert user.email_verified == True
assert user.verification_timestamp is not None
assert user.user_status == Customer.STATUS_ACTIVE

print('=== TEST 7: LOGIN (after email verification) ===')
r = urllib.request.Request(BASE+'/customer/login/', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert 'access' in resp
assert resp.get('emailVerified') == True
assert resp.get('requiresEmailVerification') == False
assert resp.get('userStatus') == 'active'
print('  PASS - JWT received')
assert resp.get('user',{}).get('isVerified') == True
assert resp.get('user',{}).get('userStatus') == 'active'
print('  user.isVerified={} user.userStatus={}'.format(resp['user']['isVerified'], resp['user']['userStatus']))

print('=== CLEANUP ===')
user.refresh_from_db()
delete_keycloak_user(user.keycloak_user_id)
user.delete()
print('  PASS')

print()
print('*** ALL 7 TESTS PASSED ***')
