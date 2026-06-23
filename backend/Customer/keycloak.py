from urllib.parse import urljoin
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


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
    logger.debug('REQUESTING KEYCLOAK ADMIN TOKEN url=%s client_id=%s realm=%s', token_url, _setting('KEYCLOAK_CLIENT_ID'), _optional_setting('KEYCLOAK_ADMIN_REALM') or 'master')
    token_response = requests.post(token_url, data=token_data, timeout=15)
    logger.debug('KEYCLOAK TOKEN RESPONSE status=%s', token_response.status_code)
    if token_response.status_code != 200:
        logger.error('Keycloak admin token request failed status=%s body=%s', token_response.status_code, token_response.text)
        raise RuntimeError(f'Token Error: {token_response.text}')

    access_token = token_response.json().get('access_token')
    if not access_token:
        raise RuntimeError('No access token received')
    logger.debug('KEYCLOAK ADMIN TOKEN ACQUIRED (first 20 chars): %s...', access_token[:20])
    return access_token


def _headers(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


def _extract_keycloak_user_id(response):
    location = response.headers.get('Location') or response.headers.get('location')
    if not location:
        raise RuntimeError('Keycloak user created but Location header was missing')
    return location.rstrip('/').split('/')[-1]


def create_keycloak_user(*, username, email, first_name, last_name, password, account_type=None, business_name=None):
    access_token = get_keycloak_admin_token()
    attributes = {}
    if account_type:
        attributes['account_type'] = [account_type]
    if business_name:
        attributes['business_name'] = [business_name]

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
    if attributes:
        payload['attributes'] = attributes

    logger.debug('=' * 60)
    logger.debug('KEYCLOAK CREATE USER REQUEST')
    logger.debug('URL: %s', _admin_api_url('users'))
    logger.debug('PAYLOAD: %s', {k: v for k, v in payload.items() if k != 'credentials'})
    logger.debug('=' * 60)
    response = requests.post(
        _admin_api_url('users'), json=payload,
        headers=_headers(access_token), timeout=15,
    )
    logger.debug('KEYCLOAK CREATE USER RESPONSE status=%s', response.status_code)
    logger.debug('RESPONSE BODY: %s', response.text[:500])
    location = response.headers.get('Location') or response.headers.get('location')
    logger.debug('LOCATION HEADER: %s', location)
    if response.status_code != 201:
        logger.error('Keycloak user creation failed email=%s status=%s body=%s', email, response.status_code, response.text)
        raise RuntimeError(f'Keycloak Error: {response.text}')
    keycloak_user_id = _extract_keycloak_user_id(response)
    logger.debug('EXTRACTED KEYCLOAK_USER_ID: %s', keycloak_user_id)
    logger.debug('=' * 60)
    logger.info('Created Keycloak user email=%s keycloak_user_id=%s', email, keycloak_user_id)
    return keycloak_user_id


def find_keycloak_user_by_email(email):
    access_token = get_keycloak_admin_token()
    logger.info('Looking up Keycloak user by email=%s realm=%s', email, _setting('KEYCLOAK_REALM'))
    response = requests.get(
        _admin_api_url('users'),
        params={'email': email, 'exact': 'true'},
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 200:
        logger.error('Keycloak user lookup failed email=%s status=%s body=%s', email, response.status_code, response.text)
        raise RuntimeError(f'Keycloak user lookup Error: {response.text}')
    users = response.json()
    for user in users:
        if str(user.get('email') or '').lower() == str(email or '').lower():
            return user.get('id')
    return None



def get_keycloak_client_config(client_id):
    access_token = get_keycloak_admin_token()
    response = requests.get(
        _admin_api_url('clients'),
        params={'clientId': client_id},
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 200:
        raise RuntimeError(f'Keycloak client lookup Error: {response.text}')
    clients = response.json()
    return clients[0] if clients else None


def _redirect_matches_pattern(redirect_uri, pattern):
    if not pattern:
        return False
    if pattern == '*':
        return True
    if pattern.endswith('*'):
        return redirect_uri.startswith(pattern[:-1])
    return redirect_uri == pattern


def is_valid_redirect_uri_for_client(client_id, redirect_uri):
    if not client_id or not redirect_uri:
        return False
    client = get_keycloak_client_config(client_id)
    if not client:
        logger.warning('Keycloak client not found for redirect validation client_id=%s', client_id)
        return False
    redirect_uris = client.get('redirectUris') or []
    return any(_redirect_matches_pattern(redirect_uri, pattern) for pattern in redirect_uris)
def send_keycloak_verification_email(keycloak_user_id, client_id=None, redirect_uri=None):
    access_token = get_keycloak_admin_token()
    params = {}
    cid = client_id

    if cid:
        params['client_id'] = cid
        if redirect_uri:
            if is_valid_redirect_uri_for_client(cid, redirect_uri):
                params['redirect_uri'] = redirect_uri
            else:
                logger.warning(
                    'Skipping Keycloak verification redirect_uri because it is not valid for client_id=%s redirect_uri=%s',
                    cid,
                    redirect_uri,
                )
    elif redirect_uri:
        logger.warning('Skipping Keycloak verification redirect_uri because no verification client is configured')

    logger.info('Triggering Keycloak execute-actions-email keycloak_user_id=%s client_id=%s redirect_uri=%s', keycloak_user_id, cid, params.get('redirect_uri'))
    response = requests.put(
        _admin_api_url(f'users/{keycloak_user_id}/execute-actions-email'),
        params=params,
        json=['VERIFY_EMAIL'],
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 204:
        logger.error('Keycloak execute-actions-email failed keycloak_user_id=%s status=%s body=%s', keycloak_user_id, response.status_code, response.text)
        raise RuntimeError(f'Keycloak execute-actions-email Error: expected 204 got {response.status_code}: {response.text}')
    logger.info('Triggered Keycloak execute-actions-email keycloak_user_id=%s actions=%s', keycloak_user_id, ['VERIFY_EMAIL'])
    return True


def check_keycloak_email_verified(keycloak_user_id):
    data = get_keycloak_user_status(keycloak_user_id)
    if data is None:
        return None
    return data.get('emailVerified', False)


def get_keycloak_user_status(keycloak_user_id):
    access_token = get_keycloak_admin_token()
    logger.info('Checking Keycloak verification status keycloak_user_id=%s', keycloak_user_id)
    response = requests.get(
        _admin_api_url(f'users/{keycloak_user_id}'),
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code != 200:
        logger.warning('Keycloak user status lookup returned status=%s keycloak_user_id=%s body=%s', response.status_code, keycloak_user_id, response.text)
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
    logger.info('Assigning Keycloak role keycloak_user_id=%s role=%s', keycloak_user_id, role_name)
    response = requests.get(role_url, headers=_headers(access_token), timeout=15)
    if response.status_code != 200:
        logger.error('Keycloak role lookup failed role=%s status=%s body=%s', role_name, response.status_code, response.text)
        raise RuntimeError(f'Keycloak role lookup Error: {response.text}')
    role = response.json()
    assignment_url = _admin_api_url(f'users/{keycloak_user_id}/role-mappings/realm')
    response = requests.post(
        assignment_url, json=[role],
        headers=_headers(access_token), timeout=15,
    )
    if response.status_code not in (200, 204):
        logger.error('Keycloak role assignment failed keycloak_user_id=%s role=%s status=%s body=%s', keycloak_user_id, role_name, response.status_code, response.text)
        raise RuntimeError(f'Keycloak role assignment Error: {response.text}')
    logger.info('Assigned Keycloak role keycloak_user_id=%s role=%s', keycloak_user_id, role_name)
    return True


def delete_keycloak_user(keycloak_user_id):
    access_token = get_keycloak_admin_token()
    response = requests.delete(
        _admin_api_url(f'users/{keycloak_user_id}'),
        headers={'Authorization': f'Bearer {access_token}'}, timeout=15,
    )
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak Delete Error: {response.text}')


