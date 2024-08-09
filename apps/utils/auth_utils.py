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

import binascii
import hashlib
import json
import os
import uuid
from datetime import datetime
from functools import reduce

from playwright.sync_api import sync_playwright
from sqlalchemy.ext.declarative import DeclarativeMeta
from urllib.parse import urlparse, parse_qs

import apps.utils.excel_document_generator as excelGenerator


def hash_pass(password):
    """Hash a password for storing."""

    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'),
                                  salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return (salt + pwdhash)  # return bytes


def verify_pass(provided_password, stored_password):
    """Verify a stored password against one provided by user"""

    stored_password = stored_password.decode('ascii')
    salt = stored_password[:64]
    stored_password = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512',
                                  provided_password.encode('utf-8'),
                                  salt.encode('ascii'),
                                  100000)
    pwdhash = binascii.hexlify(pwdhash).decode('ascii')
    return pwdhash == stored_password


def get_user_info():
    """
    :return:
    :rtype:
    """
    user_map = {'is_authenticated': False, 'role': None}
    import flask_login
    user = flask_login.current_user

    if user is not None:
        user_map['is_authenticated'] = user.is_authenticated
        user_map['role'] = user.role
        user_map['username'] = user.username
        user_map['email'] = user.email

    return user_map


def is_user_authorized(authorized_roles=None):
    """
    :param authorized_roles:
    :return:
    :rtype:
    """
    if authorized_roles is None or len(authorized_roles) == 0:
        return True

    user = get_user_info()
    for authorized_role in authorized_roles:
        if user.get('role') is not None and user.get('role').upper() == authorized_role.upper():
            return True

    return False


def authenticate(url, usr, psw):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, channel="chrome", args=['--start-maximized'])
            context = browser.new_context(no_viewport=True)
            page = context.new_page()
            page.set_default_timeout(0)
            page.goto(url)

            page.get_by_role("link").click()
            page.get_by_placeholder("Username").fill(usr)
            page.get_by_placeholder('Password').fill(psw)
            page.get_by_role("button", name="Sign In").click()

            storage_path = "apps/docs/interfaces/login_state.json"
            page.context.storage_state(path=storage_path)
            context.close()

            return storage_path
    except Exception as ex:
        return None
