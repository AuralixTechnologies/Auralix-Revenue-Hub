import csv
import io
from typing import List, Dict, Any

def generate_csv_export(headers: List[str], data_rows: List[List[Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in data_rows:
        writer.writerow(row)
    return output.getvalue()
