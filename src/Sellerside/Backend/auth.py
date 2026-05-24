""" dev - viraj """
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
import re

from models import db, User

auth = Blueprint('auth', __name__)

# Phone and password validators
def is_valid_phone(phone):
    return re.fullmatch(r"^[6-9]\d{9}$", phone)

def is_strong_password(pw):
    return re.fullmatch(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$', pw)

@auth.route('/register', methods=['POST'])
def register():
    data = request.json
    try:
        validate_email(data.get('email'))
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email address'}), 400

    if not is_valid_phone(data.get('phone', '')):
        return jsonify({'error': 'Invalid phone number'}), 400

    if not is_strong_password(data.get('password', '')):
        return jsonify({'error': 'Password must be 8+ chars, with upper/lower/digit/symbol'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 409

    hashed_pw = generate_password_hash(data['password'])

    new_user = User(
        email=data['email'],
        phone=data['phone'],
        password=hashed_pw
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered'}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.email)
        return jsonify({'token': access_token}), 200
    return jsonify({'error': 'Invalid credentials'}), 401
