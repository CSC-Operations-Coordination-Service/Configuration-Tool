#!/usr/bin/env python
#testing dataflow doc generation
"""
Standalone dataflow document generation utility.
Generates documents without S3 interaction.

Usage: generate_dataflow_document(config_id, official=False) -> io.BytesIO
"""

import io
from apps.utils.word_document_generator import (
    _build_dataflow_document_buffer,
)


def generate_dataflow_document(config_id: str, official: bool = False) -> io.BytesIO:
    """
    Generate a dataflow document from configuration data.
    
    Parameters
    ----------
    config_id : str
        Configuration ID to load from database
    official : bool
        Whether to generate official or unofficial version (default: False)
    
    Returns
    -------
    io.BytesIO
        Document buffer ready for download
    """
    return _build_dataflow_document_buffer(
        config_id=config_id,
        track_changes=False,
    )
