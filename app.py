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


# Helper methods
def is_valid_ext(filename: str) -> bool:
    global ALLOWED_EXTENSIONS
    _, ext = os.path.splitext(os.path.basename(filename))  # discard name
    if not ext:
        return False  # No extension isn't valid.

    return ext in ALLOWED_EXTENSIONS


def save_file():
    ...


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
        # Update selected file, will be managed in the select_file.html page
        return jsonify({"message": "Selected file updated successfully"}), 200
    elif request.method == "GET":
        # Get selected file
        if os.path.exists(selected_file_path):
            return send_file(selected_file_path, as_attachment=True)
        else:
            return jsonify({"error": "Selected file not found"}), 404

    else:
        return jsonify("Unsupported method"), 500


@app.route("/upload_file", methods=["POST"])
def upload_file():
    # Save file given into upload folder.
    files = request.files.values()
    if not files:
        return jsonify({"message": "No files to add were supplied"}), 200

    files = filter(lambda file: is_valid_ext(file.filename), files)

    try:
        for file in files:
            save_file(file)

        return jsonify({"message": "Files saved successfully"}), 200
    except Exception:
        return jsonify({"error": "File saving was unsuccessful"}), 500


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
