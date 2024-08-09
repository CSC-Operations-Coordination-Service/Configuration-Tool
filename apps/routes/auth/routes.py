#!/usr/bin/env python
""" Configuration Tool

The Configuration Tool is a software program produced for the European Space
Agency.

The purpose of this tool is to keep under configuration control the changes
in the Ground Segment components of the Copernicus Programme, in the
framework of the Coordination Desk Programme, managed by Telespazio S.p.A.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
"""

__author__ = "Coordination Desk Development Team"
__contact__ = "coordination_desk@telespazio.com"
__copyright__ = "Copyright 2024, Telespazio S.p.A."
__license__ = "GPLv3"
__status__ = "Production"
__version__ = "1.0.0"

import json

from flask import render_template, redirect, request, url_for, Response
from flask_login import (
    current_user,
    login_user,
    logout_user, login_required
)

from apps import db, login_manager

from apps.models.sql import UserRole
from apps.routes.auth import blueprint
from apps.routes.auth.forms import LoginForm, CreateAccountForm
from apps.models.sql import Users

from apps.utils import db_utils, auth_utils


@blueprint.route('/')
def route_default():
    return redirect(url_for('auth_blueprint.login'))


# Login & Registration

@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(request.form)
    if 'login' in request.form:

        # read form data
        username = request.form['username']
        password = request.form['password']

        # Locate user
        user = Users.get_user_by_username(username)

        # Check the password
        if user and auth_utils.verify_pass(password, user.password):
            login_user(user)
            return redirect(url_for('auth_blueprint.route_default'))

        # Something (user or pass) is not ok
        return render_template('accounts/login.html', msg='Wrong user or password', form=login_form)

    if not current_user.is_authenticated:
        return render_template('accounts/login.html', form=login_form)

    return redirect(url_for('home_blueprint.home'))


@blueprint.route('/register', methods=['GET', 'POST'])
def register():
    create_account_form = CreateAccountForm(request.form)
    if 'register' in request.form:

        username = request.form['username']
        email = request.form['email']

        # Check if username exists
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Username already registered',
                                   success=False,
                                   form=create_account_form)

        # Check email exists
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template('accounts/register.html',
                                   msg='Email already registered',
                                   success=False,
                                   form=create_account_form)

        # else we can create the user
        user = Users(**request.form)
        user.id = db_utils.generate_uuid()
        try:
            db.session.add(user)
            db.session.commit()
        except Exception as exc:
            print(exc)
            db.session.rollback()

        # Delete user from session
        logout_user()

        return render_template('accounts/register.html',
                               msg='User created successfully.',
                               success=True,
                               form=create_account_form)

    else:
        return render_template('accounts/register.html', form=create_account_form)


@blueprint.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('auth_blueprint.login'))


# Roles management

@blueprint.route('/rest/auth/roles', methods=['GET'])
@login_required
def get_roles():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        users_tuple = UserRole.get_roles()

        return Response(json.dumps(users_tuple, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/roles', methods=['POST'])
@login_required
def add_role():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0 or body.get('role_name', None) is None or len(body.get('role_name', '')) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        name = body['role_name']

        name = UserRole.save_role(name)

        return Response(json.dumps(name, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/roles', methods=['DELETE'])
@login_required
def delete_role():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0 or body.get('role_name', None) is None or len(body.get('role_name', '')) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        name = body['role_name']
        UserRole.delete_role(name)

        return Response(json.dumps("ok", cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


# Users management

@blueprint.route('/rest/auth/user', methods=['GET'])
@login_required
def get_user():
    """
    :return:
    :rtype:
    """
    try:
        user_map = auth_utils.get_user_info()

        if not user_map['is_authenticated']:
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        return Response(json.dumps(user_map, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/users', methods=['GET'])
@login_required
def get_users():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        users_tuple = Users.get_users()

        users = []
        for user in users_tuple:
            users.append({'userid': user[0], 'username': user[1], 'email': user[2], 'role': user[3]})

        return Response(json.dumps(users, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/users', methods=['POST'])
@login_required
def add_user():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        username = body['username']
        password = body['password']
        email = body['email']
        repeat = body['repeat-password']
        role = body['role']

        if (username is None and len(username) == 0 or password is None and len(password) == 0 or password != repeat or
                role is None and len(role) == 0 or email is None and len(email) == 0):
            return Response(json.dumps({'error': '500', 'message': 'Fields is not valid'}), mimetype="application/json", status=500)

        if role.upper() not in (name_role.name.upper() for name_role in UserRole.get_roles()):
            return Response(json.dumps({'error': '500', 'message': 'Role not valid'}), mimetype="application/json",
                            status=500)

        if Users.get_user_by_username(username) is not None:
            return Response(json.dumps({'error': '500', 'message': 'Username already exist'}), mimetype="application/json",
                            status=500)

        if Users.save(username.lower(), email, password, role.lower()) is None:
            return Response(json.dumps({'error': '500', 'message': 'Error in create user'}), mimetype="application/json",
                            status=500)

        body['username'] = body['username'].lower()
        body['password'] = '****'
        body['repeat-password'] = '****'

        return Response(json.dumps(body, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/users', methods=['PUT'])
@login_required
def update_user():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0 or body['user_id'] is None or len(body['user_id']) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        user_id = body['user_id']
        username = body['username']
        password = body.get('password', None)
        email = body['email']
        repeat = body.get('repeat-password', None)
        role = body['role']

        if (user_id is None or len(user_id) == 0 or username is None and len(username) == 0
                or role is None and len(role) == 0 or email is None and len(email) == 0):
            return Response(json.dumps({'error': '500', 'message': 'Fields is not valid'}), mimetype="application/json",
                            status=500)

        if role.upper() not in (name_role.name.upper() for name_role in UserRole.get_roles()):
            return Response(json.dumps({'error': '500', 'message': 'Role not valid'}), mimetype="application/json",
                            status=500)

        if Users.get_user_by_username(username) is not None and Users.get_user_by_username(username).id != user_id:
            return Response(json.dumps({'error': '500', 'message': 'Username already exist'}),
                            mimetype="application/json", status=500)

        if password is not None and len(password) > 0 and password == repeat:
            if Users.update(user_id, username.lower(), email, role.lower(), password) is None:
                return Response(json.dumps({'error': '500', 'message': 'Error in create user'}),
                                mimetype="application/json", status=500)
        else:
            if Users.update(user_id, username.lower(), email, role.lower(), None) is None:
                return Response(json.dumps({'error': '500', 'message': 'Error in create user'}),
                                mimetype="application/json", status=500)

        body['username'] = body['username'].lower()
        body['password'] = '****'
        body['repeat-password'] = '****'

        return Response(json.dumps(body, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/auth/users', methods=['DELETE'])
@login_required
def delete_user():
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        data = json.loads(request.data.decode('utf8'))
        if data.get('user_id') is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)
        user = Users.delete_user(data.get('user_id'))
        return Response(json.dumps(data, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


# Errors

@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('home/page-403.html'), 403


@blueprint.errorhandler(403)
def access_forbidden(error):
    return render_template('home/page-403.html'), 403


@blueprint.errorhandler(404)
def not_found_error(error):
    return render_template('home/page-404.html'), 404


@blueprint.errorhandler(500)
def internal_error(error):
    return render_template('home/page-500.html'), 500
