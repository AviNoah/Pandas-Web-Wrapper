from flask import *
from urllib.parse import quote
import tempfile
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
ALLOWED_EXTENSIONS: set = {".xlsx", ".csv"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
