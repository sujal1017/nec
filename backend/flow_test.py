import os, sys, json, urllib.request, random
sys.path.insert(0, r'C:\Users\hp\OneDrive\Desktop\E-comm_team_1\backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'EcommerceProject.settings'
import django; django.setup()
from Customer.models import Customer, OTPVerification
from Customer.keycloak import delete_keycloak_user, get_keycloak_user_status
from django.utils import timezone

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
print('  PASS — userId={} message={}'.format(d['userId'], d.get('message','')))

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
print('  PASS — emailVerified={} status={}'.format(resp['emailVerified'], resp['status']))

print('=== TEST 3: LOGIN (blocked — email not verified) ===')
login_data = urllib.parse.urlencode({'username':'flowend@test.com','password':'Aa1!xpass'}).encode()
r = urllib.request.Request(BASE+'/customer/login/', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
try:
    urllib.request.urlopen(r, timeout=10)
    print('  FAIL — should be 401')
    sys.exit(1)
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    assert 'Verify your email' in body.get('msg','') or 'Verify your email' in body.get('detail','')
    print('  PASS — 401 "{}"'.format(body.get('msg', body.get('detail',''))))

print('=== TEST 4: SYNC Keycloak emailVerified=true manually ===')
kc_status = get_keycloak_user_status(user.keycloak_user_id)
print('  KC status before:', kc_status)
from Customer.keycloak import update_keycloak_email_verified
update_keycloak_email_verified(user.keycloak_user_id, verified=True)
kc_status = get_keycloak_user_status(user.keycloak_user_id)
assert kc_status['emailVerified'] == True
print('  PASS — KC emailVerified set to True')

print('=== TEST 5: VERIFICATION STATUS (now verified via polling) ===')
r = urllib.request.Request(BASE+'/customer/verification-status/?email=flowend@test.com')
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert resp.get('emailVerified') == True
assert resp.get('status') == 'verified'
print('  PASS — emailVerified={}'.format(resp['emailVerified']))

# Reload user from DB to check sync
user.refresh_from_db()
print('  Django is_verified after sync:', user.is_verified)
print('  Django user_status after sync:', user.user_status)
assert user.is_verified == True

print('=== TEST 6: LOGIN (still blocked — OTP pending) ===')
r = urllib.request.Request(BASE+'/customer/login/', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
try:
    urllib.request.urlopen(r, timeout=10)
    print('  FAIL — should be 401 (OTP pending)')
    sys.exit(1)
except urllib.error.HTTPError as e:
    body = json.loads(e.read())
    assert 'Complete OTP verification' in body.get('msg','') or 'Complete OTP verification' in body.get('detail','')
    print('  PASS — 401 "{}"'.format(body.get('msg', body.get('detail',''))))

print('=== TEST 7: VERIFY OTP ===')
user.refresh_from_db()
otp_record = user.otp_verifications.filter(verified=False).first()
if not otp_record:
    from Customer.views import create_otp_for_user
    otp_record = create_otp_for_user(user)
r = urllib.request.Request(BASE+'/customer/otp/verify/', data=json.dumps({'email':'flowend@test.com','otp':otp_record.otp}).encode(), headers={'Content-Type':'application/json'})
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert resp.get('status') == 'active'
print('  PASS')

print('=== TEST 8: LOGIN (after full verification) ===')
r = urllib.request.Request(BASE+'/customer/login/', data=login_data, headers={'Content-Type':'application/x-www-form-urlencoded'})
resp = json.loads(urllib.request.urlopen(r, timeout=10).read())
assert 'access' in resp
print('  PASS — JWT received')
assert resp.get('user',{}).get('isVerified') == True
assert resp.get('user',{}).get('userStatus') == 'active'
print('  user.isVerified={} user.userStatus={}'.format(resp['user']['isVerified'], resp['user']['userStatus']))

print('=== CLEANUP ===')
user.refresh_from_db()
delete_keycloak_user(user.keycloak_user_id)
user.delete()
print('  PASS')

print()
print('*** ALL 8 TESTS PASSED ***')
