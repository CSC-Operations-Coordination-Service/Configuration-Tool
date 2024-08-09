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

from apps.routes.home import blueprint
from flask import render_template, request, redirect
from flask_login import login_required, current_user
from jinja2 import TemplateNotFound

from apps.utils import auth_utils


@blueprint.route('/home')
@login_required
def home():

    if auth_utils.is_user_authorized(['admin']):

        # Site Administrator is redirect to the general configuration management page
        return redirect("/configuration-manager.html")

    else:

        # Upon ESA's request, force redirection to the interface configuration viewer
        return redirect("/interfaces-viewer.html?id=8cf730fa_82ce_11ee_8b95_15e6d0d67ea8")


@blueprint.route('/<template>')
@login_required
def route_template(template):
    try:

        if not template.endswith('.html'):
            template += '.html'

        # Detect the current page
        segment = get_segment(request)
        admin_pages = ['users.html', 'roles.html', 'configuration-manager.html', 'interfaces-versioning.html',
                       'new-configuration.html', 'interfaces-editor.html', 'processors-editor.html',
                       'services-editor.html']
        if template in admin_pages:
            # Serve the file (if exists) from app/templates/admin/FILE.html
            return render_template("admin/" + template, segment=segment)

        # Serve the file (if exists) from app/templates/home/FILE.html
        return render_template("home/" + template, segment=segment)

    except TemplateNotFound:
        return render_template('home/page-404.html'), 404

    except:
        return render_template('home/page-500.html'), 500


# Helper - Extract current page name from request
def get_segment(request):

    try:

        segment = request.path.split('/')[-1]

        if segment == '':
            segment = 'home'

        return segment

    except:
        return None
