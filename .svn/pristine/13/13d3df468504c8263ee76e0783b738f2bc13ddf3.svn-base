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

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference


class ExcelGenerator:

    def __init__(self):
        self.workbook = Workbook()
        if self.workbook['Sheet'] is not None:
            self.workbook.remove(self.workbook['Sheet'])
        self.tab = []

    def create_tab(self, name):
        """
        :param name:
        :type name:
        :return:
        :rtype:
        """
        self.tab.append(self.workbook.create_sheet(title=name))
        if len(self.tab) <= 1:
            return 0
        return len(self.tab) -1

    def add_rows(self, index, rows=[('Number', 'Batch 1', 'Batch 2'),(2, 10, 30),(3, 40, 60),(4, 50, 70),(5, 20, 10),(6, 10, 40),(7, 50, 30),]):
        """
        :param index:
        :type index:
        :param rows:
        :type rows:
        :return:
        :rtype:
        """
        for row in rows:
            self.tab[index].append(row)
        return

    def create_bar_chart_costructor(self, index, type, metadata):
        """
        :param index:
        :type index:
        :param type:
        :type type:
        :param metadata:
        :type metadata:
        :return:
        :rtype:
        """
        barchart = BarChart()
        barchart.type = type
        barchart.style = 10
        barchart.title = metadata['title']
        barchart.y_axis.title = metadata['y_axis_title']
        barchart.x_axis.title = metadata['x_axis_title']

        data = Reference(self.tab[index], min_col=metadata['data_min_col'], min_row=metadata['data_min_row'], max_row=metadata['data_max_row'],
                         max_col=metadata['data_max_col'])
        cats = Reference(self.tab[index], min_col=metadata['cats_min_col'], min_row=metadata['cats_min_row'], max_row=metadata['cats_max_row'])
        barchart.add_data(data, titles_from_data=True)
        barchart.set_categories(cats)
        barchart.shape = 4
        self.tab[index].add_chart(barchart, metadata['chart_anchor'])

        return

    def create_bar_chart(self, index, metadata={'title': 'title','y_axis_title': 'Test number','x_axis_title': 'Sample length (mm)','data_min_col': 2,'data_min_row': 1,'data_max_row': 7,'data_max_col': 3,'cats_min_col': 1,'cats_min_row': 2,'cats_max_row': 7,'chart_anchor': "A10"}):
        """
        :param index:
        :type index:
        :param metadata:
        :type metadata:
        :return:
        :rtype:
        """
        self.create_bar_chart_costructor(index, "bar", metadata)
        return

    def create_col_chart(self, index, metadata={'title': 'title','y_axis_title': 'Test number','x_axis_title': 'Sample length (mm)','data_min_col': 2,'data_min_row': 1,'data_max_row': 7,'data_max_col': 3,'cats_min_col': 1,'cats_min_row': 2,'cats_max_row': 7,'chart_anchor': "A10"}):
        """
        :param index:
        :type index:
        :param metadata:
        :type metadata:
        :return:
        :rtype:
        """
        self.create_bar_chart_costructor(index, "col", metadata)
        return

    def save(self, file_name):
        """
        :param file_name:
        :type file_name:
        :return:
        :rtype:
        """
        self.workbook.save(file_name+".xlsx")
        return