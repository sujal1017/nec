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


def _extract_keycloak_user_id(response):
    location = response.headers.get('Location') or response.headers.get('location')
    if not location:
        raise RuntimeError('Keycloak user created but Location header was missing')
    return location.rstrip('/').split('/')[-1]


def create_keycloak_user(*, username, email, first_name, last_name, password):
    access_token = get_keycloak_admin_token()
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    realm = _setting('KEYCLOAK_REALM')
    user_url = urljoin(server_url, f'admin/realms/{realm}/users')
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }
    payload = {
        'username': username,
        'email': email,
        'firstName': first_name,
        'lastName': last_name,
        'enabled': True,
        'emailVerified': False,
        'credentials': [{
            'type': 'password',
            'value': password,
            'temporary': False,
        }],
    }

    response = requests.post(user_url, json=payload, headers=headers, timeout=15)
    if response.status_code != 201:
        raise RuntimeError(f'Keycloak Error: {response.text}')
    return _extract_keycloak_user_id(response)


def delete_keycloak_user(keycloak_user_id):
    access_token = get_keycloak_admin_token()
    server_url = _setting('KEYCLOAK_SERVER_URL').rstrip('/') + '/'
    realm = _setting('KEYCLOAK_REALM')
    user_url = urljoin(server_url, f'admin/realms/{realm}/users/{keycloak_user_id}')
    headers = {
        'Authorization': f'Bearer {access_token}',
    }
    response = requests.delete(user_url, headers=headers, timeout=15)
    if response.status_code not in (200, 204):
        raise RuntimeError(f'Keycloak Delete Error: {response.text}')

