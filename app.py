from flask import *
from urllib.parse import quote
import requests

from io import BytesIO

import os
import tempfile
import pandas as pd


app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
readers = {
    ".csv": pd.read_csv,
    ".xlsx": pd.read_excel,
    ".ods": pd.read_excel,
}
ALLOWED_EXTENSIONS: set = set(readers.keys())

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Helper methods
def is_valid_ext(filename: str) -> bool:
    global ALLOWED_EXTENSIONS
    _, ext = os.path.splitext(os.path.basename(filename))  # discard name
    if not ext:
        return False  # No extension isn't valid.

    return ext in ALLOWED_EXTENSIONS


def save_file(file) -> str:
    # Store the file in UPLOAD_FOLDER under a directory of the same as its name.
    # Return path, if failed exception must be handled in caller.
    parent = app.config["UPLOAD_FOLDER"]
    folder_name, _ = os.path.splitext(file.filename)  # discard extension

    # TODO: Handle folders with the same name later
    path = os.path.join(parent, folder_name)
    os.makedirs(path, exist_ok=True)  # Make sure folder structure exists

    file_path = os.path.join(path, file.filename)

    file.save(file_path)
    return file_path


def get_directory(filename) -> str | None:
    global ALLOWED_EXTENSIONS
    filename: str = os.path.basename(filename)
    name_part, ext = os.path.splitext(filename)

    directory = os.path.join(app.config["UPLOAD_FOLDER"], name_part)

    if not os.path.exists(directory):
        return None  # Doesn't exist

    if not ext in ALLOWED_EXTENSIONS:
        return None  # Invalid extension

    return directory


def get_file_path(filename) -> str | None:
    directory = get_directory(filename)
    if not directory:
        return None

    file_path = os.path.join(directory, os.path.basename(filename))

    if not os.path.exists(file_path):
        raise Exception(f"Excel file doesn't exist at {file_path}")

    return file_path


def get_file_filters(filename, sheet, include_disabled: bool = False) -> list[dict]:
    # Read filters JSON, and return the filters at the selected sheet
    directory = get_directory(filename)
    if not directory:
        return []  # Empty filters data

    json_path = os.path.join(directory, "filters.json")

    if not os.path.exists(json_path):
        return []  # No filters exists for this file.

    try:
        with open(json_path, "r") as file:
            json_data: list[dict] = json.load(file)

        # Keep only enabled and ones that apply to the selected sheet
        filters: filter = filter(lambda filter: filter["sheet"] == sheet, json_data)

        # Include or exclude disabled filters
        if not include_disabled:
            filters: filter = filter(lambda filter: filter["enabled"], filters)

        # Convert to list
        filters: list[dict] = list(filters)
        return filters
    except json.JSONDecodeError as e:
        raise Exception(f"Failed decoding JSON from {json_path}: {e}")


def get_file_sheets(filename) -> dict[pd.DataFrame]:
    # Return a dictionary of sheets as pandas data frame of the filename stored in the UPLOAD FOLDER

    file_path = get_file_path(filename)
    if not file_path:
        raise Exception(f"{filename} doesn't exist")

    _, ext = os.path.splitext(filename)

    try:
        # Fetch correct reader for this type
        df: dict[pd.DataFrame] = readers[ext](file_path, sheet_name=None)
    except IOError as e:
        raise Exception(f"Failed reading from {file_path}: {e}")
    except KeyError as e:
        raise Exception(f"File type {ext} is not supported")

    return df


def get_sheet(filename, sheet) -> pd.DataFrame:
    # Get the sheet with its filters applied
    sheets: list[pd.DataFrame] = list(
        get_file_sheets(filename).values()
    )  # Only relevant active filters are returned
    filters: list[dict] = get_file_filters(filename, sheet)

    df: pd.DataFrame = sheets[sheet]

    # each filter contains these keys: column, method, regex escaped input.
    for filter in filters:
        # Apply filters
        col, meth, inp = filter["column"], filter["method"], filter["input"]
        column_name = df.columns[col]

        # TODO: Handle dropping columns too as a "hide" method

        # method can be exact, contains, not contains or regex
        if meth == "exact":
            # Filter rows where the column values exactly match the input string
            df = df[df[column_name].astype(str).eq(inp)]
        elif meth == "contains":
            # Filter rows where the column values contain the input string
            df = df[df[column_name].astype(str).str.contains(inp)]
        elif meth == "not contains":
            # Filter rows where the column values do not contain the input string
            df = df[~df[column_name].astype(str).str.contains(inp)]
        elif meth == "regex":
            # Filter rows where the column values match the regex pattern
            df = df[df[column_name].astype(str).str.match(inp)]
        else:
            raise ValueError("Unsupported method")

    return df


def get_sheet_count(filename) -> int:
    # return amount of sheets in file
    return len(get_file_sheets(filename).keys())


def add_file_filters(filename: str, new_entry: dict):
    # Write to filters JSON
    directory = get_directory(filename)
    if not directory:
        raise Exception(f"{filename} has no directory!")

    json_path = os.path.join(directory, "filters.json")
    data: list[dict] = []
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            data = json.load(f)  # Load json data.

    data.append(new_entry)
    with open(json_path, "w") as f:
        json.dump(data, f, indent=4)  # make json easier to read


def send_df(
    df: pd.DataFrame, filename: str, sheet_name: str = "Sheet1", error: str = ""
) -> Response:
    try:
        # Save the DataFrame to BytesIO using openpyxl as the engine
        output = BytesIO()
        df.to_excel(output, engine="openpyxl", sheet_name=sheet_name, index=False)
        output.seek(0)  # Move to beginning of file

        filename = os.path.basename(filename)

        response = send_file(
            output,
            as_attachment=False,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        return response
    except Exception as e:
        return jsonify({f"{error}": str(e)}), 500


# Landing page
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/select_file/show")
def show_select_file():
    return render_template("select_file/select_file.html")


@app.route("/spreadsheet/show")
def show_spreadsheet():
    return render_template("spreadsheet/spreadsheet_view.html")


@app.route("/file/get", methods=["POST"])
def file_get():
    # A method to get data of or update a selected file.

    if request.method != "POST":
        return jsonify("Unsupported method"), 405

    keys = {"filename", "sheet"}

    json_data = request.get_json()
    if not json_data or not keys.issubset(json_data.keys()):
        return jsonify({"error": "Missing one or more required keys"}), 400

    selected_file_name = json_data["filename"]
    selected_sheet: int = int(json_data["sheet"])

    # Get selected file
    sheet_count: int = get_sheet_count(selected_file_name)
    df: pd.DataFrame = get_sheet(selected_file_name, selected_sheet)

    response = send_df(df, selected_file_name, error="Selected file not found")
    response.headers.add("File-Name", selected_file_name)
    response.headers.add("Sheet-Count", str(sheet_count))

    return response


@app.route("/file/update", methods=["POST"])
def file_update():
    # A Method to update a file's data

    if request.method != "POST":
        return jsonify("Unsupported method"), 405

    keys = {"filename", "sheet"}

    json_data = request.get_json()
    if not json_data or not keys.issubset(json_data.keys()):
        return jsonify({"error": "Missing one or more required keys"}), 400

    selected_file_name = json_data["filename"]
    selected_sheet: int = int(json_data["sheet"])

    # TODO: Allow renaming file and updating {excel file's contents} <- check if needing the ability to edit is needed
    return jsonify({"message": "Selected file updated successfully"}), 200


@app.route("/file/upload", methods=["POST"])
def file_upload():
    # Save file given into upload folder.
    files = list(request.files.values())

    if not files:
        return jsonify({"message": "No files to add were supplied"}), 200

    files = list(filter(lambda file: is_valid_ext(file.filename), files))

    try:
        for file in files:
            path = save_file(file)
            print(f"Saved to {path}")

        return jsonify({"message": "Files saved successfully"}), 200
    except Exception:
        return jsonify({"error": "File saving was unsuccessful"}), 500


@app.route("/filter/get", methods=["POST"])
def filter_get():
    # Get the filters of the selected file at the selected sheet.

    if request.method != "POST":
        return jsonify({"error": "Unsupported method"}), 500

    keys = {"filename", "sheet"}

    json_data = request.get_json()
    if not json_data or not keys.issubset(json_data.keys()):
        return jsonify({"error": "Missing one or more required keys"}), 400

    selected_file_name = json_data["filename"]
    selected_sheet: int = int(json_data["sheet"])

    file_filters: list[dict] = get_file_filters(
        selected_file_name, selected_sheet, include_disabled=True
    )
    return (
        jsonify({"message": "Filters read successfully", "filters": file_filters}),
        200,
    )


@app.route("/filter/update", methods=["POST"])
def filter_update():
    # Update the filters of the selected file
    if request.method != "POST":
        return jsonify({"error": "Unsupported method"}), 500

    keys = {"filename", "sheet", "column", "method", "input", "enabled"}

    json_data = request.get_json()
    if not json_data or not keys.issubset(json_data.keys()):
        return jsonify({"error": "Missing one or more required keys"}), 400

    keys.remove("filename")  # Don't pass filename

    new_entry: dict = {
        key: json_data[key] for key in keys
    }  # Extract relevant information

    try:
        add_file_filters(json_data["filename"], new_entry)
        return jsonify({"message": "Filter added successfully to file"}), 200
    except Exception as e:
        return jsonify({"error": e}), 500


@app.route("/resources/<path:path>")
def get_resource(path):
    # Serve static files from back-end
    return send_from_directory("static", path)


@app.route("/templates/<path:template>")
def get_template(template):
    # Serve template files from back-end
    return render_template(template)


@app.route("/spreadsheet/upload/test_file")
def test_file():
    try:
        files = ["test.ods", "test.xlsx", "test.csv"]
        file_name = files[0]
        files = {"file": open(f"test_file/{file_name}", "rb")}
        upload_url = "http://127.0.0.1:5000" + url_for("file_upload")
        upload_response = requests.post(upload_url, files=files)
        if not upload_response.ok:
            raise Exception("Saving file failed")

        get_file_url = "http://127.0.0.1:5000" + url_for("file_get")
        data = {"filename": file_name, "sheet": 0}
        fetch_response = requests.post(get_file_url, json=data)
        if not fetch_response.ok:
            raise Exception("Fetching file failed")

        final_response = Response(fetch_response.content)

        # Copy headers to the final response
        final_response.headers.add("Sheet-Count", fetch_response.headers["Sheet-Count"])
        final_response.headers.add("File-Name", fetch_response.headers["File-Name"])

        return final_response
    except Exception as e:
        return jsonify({"error": f"Failed to load test file: {e}"})


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
