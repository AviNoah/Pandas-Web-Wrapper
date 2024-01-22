from flask import *
from urllib.parse import quote
import tempfile
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
ALLOWED_EXTENSIONS: set = {".xlsx", ".csv"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Landing page
app.route("/")


def index():
    return render_template("")


app.route("/select_file")


def select_file():
    return render_template("select_file.html")


app.route("/spreadsheet_view")


def select_file():
    return render_template("spreadsheet_view.html")


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
