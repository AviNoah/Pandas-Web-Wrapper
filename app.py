from flask import *
from urllib.parse import quote
import os
import tempfile
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
ALLOWED_EXTENSIONS: set = {".xlsx", ".csv"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

selected_file_path: str = (
    None  # No need to make user session management, only one person will us this
)


# Landing page
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/select_file")
def show_select_file():
    return render_template("select_file.html")


@app.route("/spreadsheet_view")
def show_spreadsheet():
    return render_template("spreadsheet_view.html")


@app.route("/selected_file", methods=["POST", "GET"])
def selected_file():
    global selected_file_path
    if request.method == "POST":
        # Update selected file
        return jsonify({"message": "Selected file updated successfully"}), 200
    elif request.method == "GET":
        # Get selected file
        if os.path.exists(selected_file_path):
            return send_file(selected_file_path, as_attachment=True)
        else:
            return jsonify({"error": "Selected file not found"}), 404

    else:
        return jsonify("Unsupported method"), 500


@app.route("/filters", methods=["POST", "GET"])
def filters():
    # Either GET or UPDATE the filters of the given file.
    if request.method == "POST":
        ...
    elif request.method == "GET":
        ...

    raise NotImplementedError


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
