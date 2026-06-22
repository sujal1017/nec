from urllib.parse import urljoin

import requests
from django.conf import settings


def _setting(name):
    value = getattr(settings, name, None)
    if value in (None, ''):
        raise RuntimeError(f'{name} is not configured')
    return value


def _optional_setting(name):
    value = getattr(settings, name, None)
    return value or ''


def _realm_base_url():
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    realm = _setting('KEYCLOAK_REALM')
    return urljoin(server_url, f'realms/{realm}/')


def _admin_realm_base_url():
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    admin_realm = _optional_setting('KEYCLOAK_ADMIN_REALM') or 'master'
    return urljoin(server_url, f'realms/{admin_realm}/')


def _admin_api_url(path):
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    realm = _setting('KEYCLOAK_REALM')
    return urljoin(server_url, f'admin/realms/{realm}/{path.lstrip("/")}')


def get_keycloak_admin_token():
    token_url = urljoin(_admin_realm_base_url(), 'protocol/openid-connect/token')
    token_data = {
        'grant_type': 'password',
        'client_id': _setting('KEYCLOAK_CLIENT_ID'),
        'username': _setting('KEYCLOAK_ADMIN_USERNAME'),
        'password': _setting('KEYCLOAK_ADMIN_PASSWORD'),
    }
    client_secret = _optional_setting('KEYCLOAK_CLIENT_SECRET')
    if client_secret:
        token_data['client_secret'] = client_secret
    token_response = requests.post(token_url, data=token_data, timeout=15)
    if token_response.status_code != 200:
        raise RuntimeError(f'Token Error: {token_response.text}')

    access_token = token_response.json().get('access_token')
    if not access_token:
        raise RuntimeError('No access token received')
    return access_token


def _headers(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


def _extract_keycloak_user_id(response):
    location = response.headers.get('Location') or response.headers.get('location')
    if not location:
        raise RuntimeError('Keycloak user created but Location header was missing')
    return location.rstrip('/').split('/')[-1]


def create_keycloak_user(*, username, email, first_name, last_name, password):
    access_token = get_keycloak_admin_token()
    payload = {
        'username': username,
        'email': email,
        'firstName': first_name,
        'lastName': last_name,
        'enabled': True,
        'emailVerified': False,
        'requiredActions': ['VERIFY_EMAIL'],
        'credentials': [{
            'type': 'password',
            'value': password,
            'temporary': False,
        }],
    }

    response = requests.post(
        _admin_api_url('users'), json=payload,
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 201:
        raise RuntimeError(f'Keycloak Error: {response.text}')
    return _extract_keycloak_user_id(response)


def send_keycloak_verification_email(keycloak_user_id, client_id=None, redirect_uri=None):
    access_token = get_keycloak_admin_token()
    params = {}
    cid = client_id or _optional_setting('KEYCLOAK_VERIFICATION_CLIENT_ID') or 'ecommerce-frontend'
    if cid:
        params['client_id'] = cid
    if redirect_uri:
        params['redirect_uri'] = redirect_uri
    response = requests.put(
        _admin_api_url(f'users/{keycloak_user_id}/send-verify-email'),
        params=params, headers=_headers(access_token), timeout=15,
    )
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak send-verify-email Error: {response.text}')
    return True


def check_keycloak_email_verified(keycloak_user_id):
    data = get_keycloak_user_status(keycloak_user_id)
    if data is None:
        return None
    return data.get('emailVerified', False)


def get_keycloak_user_status(keycloak_user_id):
    access_token = get_keycloak_admin_token()
    response = requests.get(
        _admin_api_url(f'users/{keycloak_user_id}'),
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 200:
        return None
    user_data = response.json()
    return {
        'emailVerified': user_data.get('emailVerified', False),
        'enabled': user_data.get('enabled', False),
        'requiredActions': user_data.get('requiredActions', []),
    }


def update_keycloak_email_verified(keycloak_user_id, verified=True):
    access_token = get_keycloak_admin_token()
    response = requests.get(
        _admin_api_url(f'users/{keycloak_user_id}'),
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 200:
        raise RuntimeError(f'Keycloak Fetch Error: {response.text}')
    user_data = response.json()
    user_data['emailVerified'] = verified
    if verified:
        required_actions = user_data.get('requiredActions', [])
        if 'VERIFY_EMAIL' in required_actions:
            required_actions.remove('VERIFY_EMAIL')
            user_data['requiredActions'] = required_actions

    response = requests.put(
        _admin_api_url(f'users/{keycloak_user_id}'),
        json=user_data, headers=_headers(access_token), timeout=15,
    )
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak Update Error: {response.text}')
    return True


def assign_keycloak_role(keycloak_user_id, role_name):
    access_token = get_keycloak_admin_token()
    role_url = _admin_api_url(f'roles/{role_name}')
    response = requests.get(role_url, headers=_headers(access_token), timeout=15)
    if response.status_code != 200:
        raise RuntimeError(f'Keycloak role lookup Error: {response.text}')
    role = response.json()
    assignment_url = _admin_api_url(f'users/{keycloak_user_id}/role-mappings/realm')
    response = requests.post(
        assignment_url, json=[role],
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak role assignment Error: {response.text}')
    return True


def delete_keycloak_user(keycloak_user_id):
    access_token = get_keycloak_admin_token()
    response = requests.delete(
        _admin_api_url(f'users/{keycloak_user_id}'),
        headers={'Authorization': f'Bearer {access_token}'}, timeout=15,
    )
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak Delete Error: {response.text}')
